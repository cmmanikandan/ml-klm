import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  User, 
  Phone, 
  Plus, 
  Trash2, 
  Printer, 
  CreditCard, 
  CheckCircle2, 
  Calculator, 
  History, 
  DollarSign, 
  Package, 
  X, 
  Edit3, 
  Share2, 
  MessageSquare,
  Sparkles,
  RefreshCw,
  Tag,
  QrCode,
  ArrowLeft,
  Wrench,
  Mic
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { VoiceSearchModal } from '../../components/common/VoiceSearchModal';
import { NotificationModal, NotificationState } from '../../components/common/NotificationModal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { DEFAULT_SHOP_INFO, supabase } from '../../lib/supabase';
import { fetchActiveProducts } from '../../lib/productsStore';
import { filterProductsSmartly } from '../../lib/searchHelper';
import { Product, Profile, Order } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { generateInvoiceWhatsAppText, sendToWhatsApp, formatINR } from '../../lib/whatsappHelper';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unit_price: number;
  pricing_type: 'weight' | 'sqft' | 'fixed';
  weight_calculation?: any;
  sqft_calculation?: any;
  discount: number;
  line_total: number;
}

export const AdminPOSPage: React.FC = () => {
  const navigate = useNavigate();

  const { language, t } = useLanguage();
  const isTamil = language === 'ta';

  // Active Tab: 'pos' | 'history'
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  // Mobile POS View Tab: 'products' | 'cart'
  const [mobilePosTab, setMobilePosTab] = useState<'products' | 'cart'>('products');

  // Customer State
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null);

  // New Walk-in Customer Form State
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerVillage, setCustomerVillage] = useState('');

  // Products & Search State
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [posNotes, setPosNotes] = useState<string>('Counter POS Sale');

  // Modal for Custom Lathe / Welding Work in POS
  const [showCustomItemModal, setShowCustomItemModal] = useState<boolean>(false);
  const [customItemName, setCustomItemName] = useState<string>('');
  const [customItemPrice, setCustomItemPrice] = useState<number | ''>('');
  const [customItemQty, setCustomItemQty] = useState<number>(1);
  const [customItemCategory, setCustomItemCategory] = useState<string>('Lathe Machining');
  const [customItemNotes, setCustomItemNotes] = useState<string>('');

  // Modal for Weight Calculation in POS
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [modalParts, setModalParts] = useState<{ name: string; weight_kg: number | '' }[]>([
    { name: '', weight_kg: '' }
  ]);
  const [modalRatePerKg, setModalRatePerKg] = useState<number>(160);
  const [modalExtraCharges, setModalExtraCharges] = useState<{ description: string; amount: number | '' }[]>([]);
  const [modalDiscount, setModalDiscount] = useState<number>(0);

  // Modal for SqFt Calculation in POS
  const [sqftModalProduct, setSqftModalProduct] = useState<Product | null>(null);
  const [sqftHeight, setSqftHeight] = useState<number>(6);
  const [sqftWidth, setSqftWidth] = useState<number>(8);
  const [sqftRate, setSqftRate] = useState<number>(150);
  const [sqftExtraCharges, setSqftExtraCharges] = useState<{ description: string; amount: number | '' }[]>([]);

  // UPI QR Payment Modal State
  const [showUpiModal, setShowUpiModal] = useState<boolean>(false);

  // Thermal Slip Modal State
  const [showThermalModal, setShowThermalModal] = useState<boolean>(false);

  // POS History State
  const [posOrdersHistory, setPosOrdersHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [editingHistoryOrder, setEditingHistoryOrder] = useState<any | null>(null);

  // Success Modal
  const [lastCreatedOrder, setLastCreatedOrder] = useState<any | null>(null);

  // Custom Card Popup Notification Modal State
  const [notifyModal, setNotifyModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'error' | 'warning' | 'success' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning'
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const activeProds = await fetchActiveProducts();
      setProducts(activeProds);

      const { data: profiles } = await supabase.from('profiles').select('*').order('full_name');
      const localContacts: Profile[] = JSON.parse(localStorage.getItem('ml_customer_contacts') || '[]');

      let combinedCust = [...(profiles || []), ...localContacts];
      const seenCust = new Set();
      combinedCust = combinedCust.filter((c) => {
        const key = c.id || c.phone || c.full_name;
        if (!key || seenCust.has(key)) return false;
        seenCust.add(key);
        return true;
      });

      setCustomers(combinedCust);

      loadPOSHistory();
    } catch (e) {
      console.warn('POS initial data load fallback', e);
    } finally {
      setLoading(false);
    }
  };

  const loadPOSHistory = async () => {
    try {
      let dbOrders: any[] = [];
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && !error) {
          dbOrders = data.filter((o: any) => 
            o.is_pos === true || 
            (o.admin_notes && o.admin_notes.includes('POS')) || 
            String(o.order_number || '').includes('POS')
          );
        }
      } catch (err) {
        console.warn('Supabase DB POS history query fallback', err);
      }

      const hydrated = dbOrders.map((o: any) => ({
        ...o,
        customerName: o.customer_name || o.customerName || 'Walk-in Customer',
        customerPhone: o.customer_phone || o.customerPhone || '',
        productName: o.product_name || o.productName || o.specifications || 'Custom Lathe Item',
      }));

      setPosOrdersHistory(hydrated);
    } catch (e) {
      console.warn('POS history fetch error', e);
    }
  };

  // Filter Customers for Search Dropdown
  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch.trim()) return false;
    const term = customerSearch.toLowerCase();
    const nameMatch = c.full_name?.toLowerCase().includes(term);
    const phoneMatch = c.phone?.includes(term);
    return nameMatch || phoneMatch;
  });

  const handleSelectCustomer = (cust: Profile) => {
    setSelectedCustomer(cust);
    setCustomerName(cust.full_name || '');
    setCustomerPhone(cust.phone || '');
    setCustomerSearch(cust.full_name || cust.phone || '');
    setShowCustomerDropdown(false);
  };

  // Voice Search Modal States
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [showCustomerVoiceModal, setShowCustomerVoiceModal] = useState<boolean>(false);

  // Filter Products Smartly (Supports multi-word, phonetic corrections e.g. gills->grill, Tamil-English keywords)
  const categoryBaseProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.category_name?.toLowerCase() === selectedCategory.toLowerCase());

  const filteredProducts = productSearch.trim()
    ? filterProductsSmartly(categoryBaseProducts, productSearch)
    : categoryBaseProducts;

  // Determine Product Pricing Type
  const getProductPricingType = (prod: Product): 'weight' | 'sqft' | 'fixed' => {
    if (prod.pricing_type === 'weight') return 'weight';
    if (prod.pricing_type === 'sqft') return 'sqft';
    if (prod.pricing_type === 'fixed') return 'fixed';
    
    const nameLower = prod.name_en.toLowerCase();
    if (nameLower.includes('gate') || nameLower.includes('grill') || nameLower.includes('rail')) return 'weight';
    if (nameLower.includes('shutter') || nameLower.includes('window')) return 'sqft';
    return 'fixed';
  };

  // Add Product Card Click Handler
  const handleProductCardClick = (prod: Product) => {
    const pType = getProductPricingType(prod);
    if (pType === 'weight') {
      handleOpenWeightModal(prod);
    } else if (pType === 'sqft') {
      handleOpenSqftModal(prod);
    } else {
      handleAddFixedProduct(prod);
    }
  };

  // Add Fixed Price Product to Cart (Switches to Cart view on mobile)
  const handleAddFixedProduct = (prod: Product) => {
    const existingIdx = cart.findIndex((item) => item.product.id === prod.id && item.pricing_type === 'fixed');
    const unitPrice = prod.admin_price || 1500;

    if (existingIdx >= 0) {
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      updated[existingIdx].line_total = (updated[existingIdx].quantity * updated[existingIdx].unit_price) - updated[existingIdx].discount;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          product: prod,
          quantity: 1,
          unit_price: unitPrice,
          pricing_type: 'fixed',
          discount: 0,
          line_total: unitPrice
        }
      ]);
    }
    // Auto-navigate to Cart view on mobile
    setMobilePosTab('cart');
  };

  // Open Weight Calculator Modal - STARTS CLEAN & EMPTY
  const handleOpenWeightModal = (prod: Product) => {
    setWeightModalProduct(prod);
    setModalRatePerKg(prod.price_per_kg || 160);
    setModalParts([
      { name: '', weight_kg: '' }
    ]);
    setModalExtraCharges([]);
    setModalDiscount(0);
  };

  // Confirm Weight Calculator & Add to Cart (Switches to Cart view on mobile)
  const handleAddWeightItemToCart = () => {
    if (!weightModalProduct) return;
    const totalWeight = modalParts.reduce((sum, p) => sum + (Number(p.weight_kg) || 0), 0);
    const weightSubtotal = Math.round(totalWeight * modalRatePerKg);
    const extraSubtotal = modalExtraCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const finalGrandTotal = Math.max(0, weightSubtotal + extraSubtotal - modalDiscount);

    const formattedParts = modalParts.map((p, idx) => ({
      name: p.name.trim() || `${weightModalProduct.name_en} Piece ${idx + 1}`,
      weight_kg: Number(p.weight_kg) || 0
    }));

    const calcData = {
      product_name: weightModalProduct.name_en,
      parts: formattedParts,
      rate_per_kg: modalRatePerKg,
      total_weight_kg: totalWeight,
      weight_subtotal: weightSubtotal,
      extra_charges: modalExtraCharges,
      extra_subtotal: extraSubtotal,
      discount: modalDiscount,
      grand_total: finalGrandTotal
    };

    setCart([
      ...cart,
      {
        id: `cart_wt_${Date.now()}`,
        product: weightModalProduct,
        quantity: 1,
        unit_price: finalGrandTotal,
        pricing_type: 'weight',
        weight_calculation: calcData,
        discount: modalDiscount,
        line_total: finalGrandTotal
      }
    ]);

    setWeightModalProduct(null);
    setMobilePosTab('cart');
  };

  // Open SqFt Calculator Modal
  const handleOpenSqftModal = (prod: Product) => {
    setSqftModalProduct(prod);
    setSqftRate(prod.price_per_sqft || 150);
    setSqftHeight(6);
    setSqftWidth(8);
    setSqftExtraCharges([]);
  };

  // Confirm SqFt Calculator & Add to Cart (Switches to Cart view on mobile)
  const handleAddSqftItemToCart = () => {
    if (!sqftModalProduct) return;
    const totalSqFt = Math.round(sqftHeight * sqftWidth * 100) / 100;
    const sqftSubtotal = Math.round(totalSqFt * sqftRate);
    const extraSubtotal = sqftExtraCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const finalGrandTotal = sqftSubtotal + extraSubtotal;

    const calcData = {
      height_ft: sqftHeight,
      width_ft: sqftWidth,
      total_sqft: totalSqFt,
      rate_per_sqft: sqftRate,
      sqft_subtotal: sqftSubtotal,
      extra_charges: sqftExtraCharges,
      extra_subtotal: extraSubtotal,
      grand_total: finalGrandTotal
    };

    setCart([
      ...cart,
      {
        id: `cart_sqft_${Date.now()}`,
        product: sqftModalProduct,
        quantity: 1,
        unit_price: finalGrandTotal,
        pricing_type: 'sqft',
        sqft_calculation: calcData,
        discount: 0,
        line_total: finalGrandTotal
      }
    ]);

    setSqftModalProduct(null);
    setMobilePosTab('cart');
  };

  // Update Cart Item Quantity or Unit Price or Discount
  const handleUpdateCartItem = (id: string, updates: Partial<CartItem>) => {
    const updated = cart.map((item) => {
      if (item.id === id) {
        const qty = updates.quantity !== undefined ? Math.max(1, updates.quantity) : item.quantity;
        const uPrice = updates.unit_price !== undefined ? Math.max(0, updates.unit_price) : item.unit_price;
        const disc = updates.discount !== undefined ? Math.max(0, updates.discount) : item.discount;
        const lineTot = (qty * uPrice) - disc;

        return {
          ...item,
          quantity: qty,
          unit_price: uPrice,
          discount: disc,
          line_total: Math.max(0, lineTot)
        };
      }
      return item;
    });

    setCart(updated);
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart(cart.filter((item) => item.id !== cartId));
  };

  // Cart Subtotal & Calculated Totals
  const cartSubtotal = cart.reduce((sum, item) => sum + item.line_total, 0);
  const finalCartGrandTotal = Math.max(0, cartSubtotal - cartDiscount);

  // Add Custom Lathe / Machining / Welding Item to Cart
  const handleAddCustomLatheItem = () => {
    const finalName = customItemName.trim() || (isTamil ? 'தனிப்பயன் லேத் வேலை' : 'Custom Lathe Work');
    const price = Number(customItemPrice) || 0;
    if (price <= 0) {
      setNotifyModal({
        isOpen: true,
        title: isTamil ? 'தொகை தேவை' : 'Enter Amount',
        message: isTamil ? 'தயவுசெய்து கட்டணத் தொகையை உள்ளிடவும்.' : 'Please enter a valid amount (₹) for this custom work.',
        type: 'warning'
      });
      return;
    }

    const qty = Math.max(1, customItemQty);
    const lineTot = price * qty;

    const pseudoProduct: Product = {
      id: `custom_job_${Date.now()}`,
      name_en: finalName,
      name_ta: finalName,
      category_name: customItemCategory,
      pricing_type: 'fixed',
      admin_price: price,
      is_active: true,
      is_best_selling: false,
      is_new: false,
      images: ['https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80'],
      primary_image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80'
    };

    setCart([
      ...cart,
      {
        id: `cart_cust_${Date.now()}`,
        product: pseudoProduct,
        quantity: qty,
        unit_price: price,
        pricing_type: 'fixed',
        discount: 0,
        line_total: lineTot
      }
    ]);

    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemQty(1);
    setCustomItemNotes('');
    setShowCustomItemModal(false);
    setMobilePosTab('cart');
  };

  // Change / Balance Math
  const changeBalance = amountPaid > 0 ? (amountPaid - finalCartGrandTotal) : 0;

  // Reset to New Bill
  const handleResetNewBill = () => {
    setCart([]);
    setCartDiscount(0);
    setAmountPaid(0);
    setCustomerPhone('');
    setCustomerName('');
    setCustomerVillage('');
    setSelectedCustomer(null);
    setCustomerSearch('');
    setPosNotes('Counter POS Sale');
    setShowUpiModal(false);
    setShowThermalModal(false);
    setMobilePosTab('products');
  };

  // Complete POS Sale - SEQUENTIAL ORDER NUMBER GENERATION (1, 2, 3...)
  const handleCompleteSale = async (overridePaymentMode?: 'cash' | 'upi') => {
    if (!customerPhone.trim()) {
      setNotifyModal({
        isOpen: true,
        title: isTamil ? 'மொபைல் எண் தேவை' : 'Customer Mobile Required',
        message: isTamil ? 'பில் தயாரிக்க வாடிக்கையாளர் மொபைல் எண்ணைப் பதிவு செய்யவும்.' : 'Please enter Customer Mobile Number before completing the POS receipt.',
        type: 'warning'
      });
      setMobilePosTab('cart');
      return;
    }
    if (cart.length === 0) {
      setNotifyModal({
        isOpen: true,
        title: isTamil ? 'பொருட்கள் சேர்க்கவும்' : 'POS Cart Empty',
        message: isTamil ? 'பட்டியலில் இருந்து பொருட்களை அல்லது புதிய லேத் வேலையை சேர்க்கவும்.' : 'Cart is empty! Click any product or add custom lathe work.',
        type: 'info'
      });
      setMobilePosTab('products');
      return;
    }

    const mode = overridePaymentMode || paymentMode;
    
    // Sequential Order Number: 1, 2, 3...
    const nextSeqNo = posOrdersHistory.length + 1;
    const orderNo = `MNK-POS-${nextSeqNo}`;
    const orderId = crypto.randomUUID();

    const mainItem = cart[0];
    const customerDisplayName = customerName.trim() || (isTamil ? 'நேரடி கவுண்டர் வாடிக்கையாளர்' : 'Walk-in Counter Customer');
    const customerAddressText = customerVillage.trim() ? `${customerVillage.trim()}, Direct Workshop Counter Pickup` : 'Direct Workshop Counter Pickup (Kallimandhayam)';

    const paid = amountPaid > 0 ? amountPaid : finalCartGrandTotal;
    const remaining = Math.max(0, finalCartGrandTotal - paid);
    const isPaid = remaining === 0;

    const itemsSummaryList = cart.map(i => ({
      name: isTamil ? (i.product.name_ta || i.product.name_en) : i.product.name_en,
      quantity: i.quantity,
      price: i.unit_price,
      total: i.line_total
    }));

    const posOrderObj: Order = {
      id: orderId,
      order_number: orderNo,
      user_id: selectedCustomer?.id || 'pos_customer',
      customerName: customerDisplayName,
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddressText,
      product_id: mainItem.product.id,
      productName: cart.length > 1 ? `${mainItem.product.name_en} (+${cart.length - 1} items)` : mainItem.product.name_en,
      productImage: mainItem.product.primary_image || (mainItem.product.images && mainItem.product.images[0]),
      quantity: cart.reduce((sum, i) => sum + i.quantity, 0),
      status: 'delivered',
      total_amount: finalCartGrandTotal,
      advance_amount: paid,
      remaining_amount: remaining,
      payment_status: isPaid ? 'paid' : 'partially_paid',
      is_payment_requested: false,
      payment_request_amount: 0,
      pricing_type: mainItem.pricing_type,
      weight_calculation: mainItem.weight_calculation || mainItem.sqft_calculation,
      is_pos: true,
      admin_notes: `POS Counter Sale (${mode.toUpperCase()}) - ${posNotes}`,
      created_at: new Date().toISOString()
    };

    // Save locally
    const localOrders = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    localStorage.setItem('ml_orders', JSON.stringify([posOrderObj, ...localOrders]));

    // Record Payment transaction
    const paymentObj = {
      id: `pay_pos_${Date.now()}`,
      order_id: orderId,
      order_number: orderNo,
      amount: paid,
      payment_mode: `POS Counter (${mode.toUpperCase()})`,
      notes: posNotes,
      created_at: new Date().toISOString(),
      status: 'completed'
    };

    // Try Supabase Insert with full cross-device sync fields
    try {
      const dbPayload = {
        id: orderId,
        order_number: orderNo,
        user_id: selectedCustomer?.id || 'pos_customer',
        customer_name: customerDisplayName,
        customer_phone: customerPhone.trim(),
        customer_address: customerAddressText,
        product_id: mainItem.product.id && UUID_REGEX.test(mainItem.product.id) ? mainItem.product.id : null,
        product_name: posOrderObj.productName,
        quantity: posOrderObj.quantity,
        status: 'delivered',
        fabrication_stage: 'delivered',
        total_amount: finalCartGrandTotal,
        advance_amount: paid,
        remaining_amount: remaining,
        payment_status: isPaid ? 'paid' : 'partially_paid',
        is_pos: true,
        pricing_type: mainItem.pricing_type,
        weight_calculation: mainItem.weight_calculation || mainItem.sqft_calculation,
        admin_notes: posOrderObj.admin_notes,
        specifications: posOrderObj.productName,
        delivery_location: customerAddressText,
        created_at: new Date().toISOString()
      };

      await supabase.from('orders').insert(dbPayload);

      const dbPayment = {
        id: crypto.randomUUID(),
        order_id: orderId,
        order_number: orderNo,
        amount: paid,
        payment_mode: `POS Counter (${mode.toUpperCase()})`,
        notes: posNotes || 'POS Counter Sale Payment',
        created_at: new Date().toISOString(),
        status: 'completed'
      };
      await supabase.from('payments').insert(dbPayment);
    } catch (e) {
      console.warn('POS DB save fallback', e);
    }

    setShowUpiModal(false);
    setLastCreatedOrder({
      ...posOrderObj,
      items: itemsSummaryList
    });
    handleResetNewBill();
    loadPOSHistory();
  };

  // WhatsApp Share Generator for POS Bill using helper
  const handleShareWhatsAppBill = (ord: any) => {
    const message = generateInvoiceWhatsAppText(
      {
        order_number: ord.order_number || ord.id,
        id: ord.id,
        customer_name: ord.customer_name || ord.customerName,
        items: ord.items,
        productName: ord.product_name || ord.productName,
        quantity: ord.quantity,
        total_amount: ord.total_amount,
        advance_amount: ord.advance_amount,
        remaining_amount: ord.remaining_amount,
        payment_status: ord.payment_status
      },
      isTamil ? 'ta' : 'en'
    );

    sendToWhatsApp(ord.customer_phone || ord.customerPhone || DEFAULT_SHOP_INFO.whatsapp, message);
  };

  // SMS Share Generator for POS Bill
  const handleShareSMSBill = (ord: any) => {
    const rawPhone = (ord.customerPhone || '').replace(/[^0-9]/g, '');
    const phone = rawPhone ? (rawPhone.startsWith('91') ? `+${rawPhone}` : `+91${rawPhone}`) : '+919659286268';
    const targetInvoiceNo = ord.order_number || ord.id;
    const body = encodeURIComponent(
      `MANIKANDAN LATHE: Bill #${ord.order_number} for ${ord.customerName || 'Valued Customer'}. Paid: Rs.${(ord.advance_amount || ord.total_amount || 0).toLocaleString('en-IN')}. View Invoice: ${window.location.origin}/invoice/${targetInvoiceNo} Ph: 9659286268`
    );
    window.open(`sms:${phone}?body=${body}`, '_blank');
  };

  // Handle Editing Past History Order
  const handleSaveHistoryOrderEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHistoryOrder) return;

    const updatedList = posOrdersHistory.map((o) => (o.id === editingHistoryOrder.id ? editingHistoryOrder : o));
    setPosOrdersHistory(updatedList);

    const localOrders: any[] = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    const updatedLocal = localOrders.map((o) => (o.id === editingHistoryOrder.id ? editingHistoryOrder : o));
    localStorage.setItem('ml_orders', JSON.stringify(updatedLocal));

    try {
      await supabase.from('orders').update({
        total_amount: editingHistoryOrder.total_amount,
        advance_amount: editingHistoryOrder.advance_amount,
        remaining_amount: editingHistoryOrder.remaining_amount,
        payment_status: editingHistoryOrder.payment_status,
        admin_notes: editingHistoryOrder.admin_notes
      }).eq('id', editingHistoryOrder.id);
    } catch (e) {
      console.warn('POS History update fallback', e);
    }

    setEditingHistoryOrder(null);
    setNotifyModal({
      isOpen: true,
      title: 'POS Order Updated',
      message: 'POS Sale record updated successfully!',
      type: 'success'
    });
  };

  // Handle Deleting History Order State
  const [deletePosOrderId, setDeletePosOrderId] = useState<string | null>(null);

  const confirmDeleteHistoryOrder = async () => {
    if (!deletePosOrderId) return;
    const orderId = deletePosOrderId;

    const filtered = posOrdersHistory.filter((o) => o.id !== orderId);
    setPosOrdersHistory(filtered);

    const localOrders: any[] = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    const updatedLocal = localOrders.filter((o) => o.id !== orderId);
    localStorage.setItem('ml_orders', JSON.stringify(updatedLocal));

    try {
      await supabase.from('orders').delete().eq('id', orderId);
    } catch (e) {
      console.warn('POS History delete fallback', e);
    }
    setDeletePosOrderId(null);
  };

  // Filter History Search
  const filteredHistory = posOrdersHistory.filter((o) => {
    if (!historySearch.trim()) return true;
    const term = historySearch.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(term) ||
      o.customerName?.toLowerCase().includes(term) ||
      o.customerPhone?.includes(term)
    );
  });

  // Dynamic UPI QR Code URL for counter payments
  const upiQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=upi://pay?pa=9659286268@upi&pn=MANIKANDAN%20LATHE&am=${finalCartGrandTotal}&cu=INR`;

  return (
    <div className="space-y-6">
      
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl font-black text-charcoal-900">POS System & Counter Sales</h1>
          </div>
          <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
            Quick offline counter sales with weight calculators, discounts & instant bill printing
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-warm-border shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'pos'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-charcoal-600 hover:text-brand-600'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Counter POS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-charcoal-600 hover:text-brand-600'
            }`}
          >
            <History className="w-4 h-4" />
            <span>POS Sales History ({posOrdersHistory.length})</span>
          </button>
        </div>
      </div>

      {/* POS COUNTER TAB */}
      {activeTab === 'pos' && (
        <div className="space-y-4">

          {/* MOBILE VIEW SWITCHER SUB-TAB BAR (Visible on Mobile screens) */}
          <div className="flex lg:hidden bg-white p-1.5 rounded-2xl border border-warm-border shadow-sm">
            <button
              type="button"
              onClick={() => setMobilePosTab('products')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                mobilePosTab === 'products'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-charcoal-600 hover:bg-warm-hover'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>1. Products Catalog</span>
            </button>

            <button
              type="button"
              onClick={() => setMobilePosTab('cart')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                mobilePosTab === 'cart'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-charcoal-600 hover:bg-warm-hover'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>2. POS Cart ({cart.length}) {finalCartGrandTotal > 0 ? `- ₹${finalCartGrandTotal.toLocaleString('en-IN')}` : ''}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Customer Search & Product Selection */}
            <div className={`lg:col-span-2 space-y-6 ${mobilePosTab === 'products' ? 'block' : 'hidden lg:block'}`}>
              
              {/* Customer Search & Selection Card */}
              <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-brand-600 uppercase tracking-widest flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span>Customer Details (Mobile Required *)</span>
                  </span>

                  {selectedCustomer && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Registered Customer Selected</span>
                    </span>
                  )}
                </div>

                {/* Customer Search Dropdown */}
                <div className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                        if (!e.target.value) setSelectedCustomer(null);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder={isTamil ? 'வாடிக்கையாளர் பெயர் அல்லது மொபைல் எண் தேடுக...' : 'Search existing customer by Name or Mobile No...'}
                      className="w-full pl-10 pr-10 py-2.5 text-xs font-bold border border-warm-border rounded-xl bg-warm-bg focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomerVoiceModal(true)}
                      title={isTamil ? 'குரல் மூலம் வாடிக்கையாளர் தேடு' : 'Voice Search Customer'}
                      className="absolute right-2.5 top-2 p-1 text-charcoal-400 hover:text-brand-600 transition-colors"
                    >
                      <Mic className="w-4 h-4 text-brand-600" />
                    </button>
                  </div>

                  {/* Dropdown Results */}
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 top-12 bg-white rounded-2xl border border-warm-border shadow-xl max-h-60 overflow-y-auto divide-y divide-warm-muted">
                      {filteredCustomers.map((cust) => {
                        const firstChar = (cust.full_name || 'C').charAt(0).toUpperCase();
                        return (
                          <button
                            key={cust.id}
                            type="button"
                            onClick={() => handleSelectCustomer(cust)}
                            className="w-full text-left p-3 hover:bg-warm-hover transition-colors flex items-center gap-3"
                          >
                            <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden flex items-center justify-center border-2 border-brand-400 bg-brand-600 text-white font-black text-xs shadow-sm">
                              {cust.avatar_url ? (
                                <img src={cust.avatar_url} alt={cust.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{firstChar}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black text-charcoal-900 truncate">{cust.full_name || 'Customer'}</p>
                              <p className="text-[11px] text-charcoal-500 font-mono font-bold truncate">{cust.phone || 'No phone'}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Direct Mobile, Name & Town Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-extrabold text-charcoal-700 mb-1">
                      {isTamil ? 'மொபைல் எண் *' : 'Mobile Number *'} <span className="text-rose-500">({isTamil ? 'அவசியம்' : 'Required'})</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-brand-600 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+91 96592 86268"
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono font-black border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-charcoal-700 mb-1">
                      {isTamil ? 'வாடிக்கையாளர் பெயர்' : 'Customer Name'} <span className="text-charcoal-400">({isTamil ? 'விருப்பத்தின்பேரில்' : 'Optional'})</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={isTamil ? 'எ.கா: மணிகண்டன்' : 'e.g. Manikandan Prabhu'}
                      className="w-full px-3 py-2 text-xs font-bold border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-charcoal-700 mb-1">
                      {isTamil ? 'ஊர் / கிராமம்' : 'Village / Town'} <span className="text-charcoal-400">({isTamil ? 'விருப்பத்தின்பேரில்' : 'Optional'})</span>
                    </label>
                    <input
                      type="text"
                      value={customerVillage}
                      onChange={(e) => setCustomerVillage(e.target.value)}
                      placeholder={isTamil ? 'எ.கா: கள்ளிமந்தையம்' : 'e.g. Kallimandhayam'}
                      className="w-full px-3 py-2 text-xs font-bold border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Product Selection Catalog & Custom Lathe Work Header */}
              <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-brand-600 uppercase tracking-widest flex items-center gap-1.5">
                      <Package className="w-4 h-4" />
                      <span>{isTamil ? 'பொருட்கள் & சேவைகள்' : 'Catalog & Lathe Services'}</span>
                    </span>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder={isTamil ? 'பொருட்களைத் தேடுக (எ.கா: கலப்பை)...' : 'Search products (e.g. 7 kallapai)...'}
                      className="w-full pl-8 pr-8 py-1.5 text-xs font-bold border border-warm-border rounded-xl bg-warm-bg focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowVoiceModal(true)}
                      title={isTamil ? 'குரல் மூலம் தேடு' : 'Voice Search'}
                      className="absolute right-2 top-1.5 p-1 text-charcoal-400 hover:text-brand-600 transition-colors"
                    >
                      <Mic className="w-4 h-4 text-brand-600" />
                    </button>
                  </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1 pb-24 sm:pb-2">
                  
                  {/* 1. SPECIAL CUSTOM LATHE WORK CARD (Clean Simple Design) */}
                  <div
                    onClick={() => {
                      setCustomItemName('');
                      setCustomItemPrice('');
                      setShowCustomItemModal(true);
                    }}
                    className="bg-purple-50/70 hover:bg-purple-100/90 p-3 rounded-2xl border border-purple-200 hover:border-purple-500 cursor-pointer flex items-center justify-between gap-2.5 transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-charcoal-900 truncate">
                          {isTamil ? 'தனிப்பயன் லேத் வேலை' : 'Custom Lathe Work'}
                        </h4>
                        <span className="text-[11px] font-mono font-bold text-purple-700 block">
                          {isTamil ? 'தொகை உள்ளிட' : 'Enter Rate (₹)'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomItemName('');
                        setCustomItemPrice('');
                        setShowCustomItemModal(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-sm shrink-0 flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isTamil ? 'சேர்' : 'Add'}</span>
                    </button>
                  </div>

                  {filteredProducts.map((prod) => {
                    const pType = getProductPricingType(prod);
                    
                    let priceText = '';
                    let btnColorClass = '';
                    let iconElement = null;

                    if (pType === 'weight') {
                      priceText = `₹${prod.price_per_kg || 160}/kg`;
                      btnColorClass = 'bg-amber-600 hover:bg-amber-700 text-white';
                      iconElement = <Calculator className="w-3.5 h-3.5" />;
                    } else if (pType === 'sqft') {
                      priceText = `₹${prod.price_per_sqft || 150}/sqft`;
                      btnColorClass = 'bg-blue-600 hover:bg-blue-700 text-white';
                      iconElement = <Calculator className="w-3.5 h-3.5" />;
                    } else {
                      priceText = `₹${(prod.admin_price || 1500).toLocaleString('en-IN')}`;
                      btnColorClass = 'bg-emerald-600 hover:bg-emerald-700 text-white';
                      iconElement = <Plus className="w-3.5 h-3.5" />;
                    }

                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleProductCardClick(prod)}
                        className="bg-warm-bg/70 hover:bg-amber-50/80 p-3 rounded-2xl border border-warm-border hover:border-brand-500 cursor-pointer flex items-center justify-between gap-2.5 transition-all shadow-sm group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={prod.primary_image || (prod.images && prod.images[0]) || 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=600'}
                            alt={prod.name_en}
                            className="w-11 h-11 rounded-xl object-contain bg-white p-1 border border-warm-border shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-charcoal-900 truncate">{prod.name_en}</h4>
                            <span className="text-xs font-mono font-black text-charcoal-800 mt-0.5 block">{priceText}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductCardClick(prod);
                          }}
                          className={`font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-sm shrink-0 flex items-center gap-1 transition-colors ${btnColorClass}`}
                        >
                          {iconElement}
                          <span>{pType === 'fixed' ? (isTamil ? 'சேர்' : 'Add') : pType === 'weight' ? (isTamil ? 'எடை' : 'Weight') : (isTamil ? 'அளவு' : 'SqFt')}</span>
                        </button>
                      </div>
                    );
                  })}

                  {/* Spacer for Mobile Floating Cart Bar */}
                  {cart.length > 0 && (
                    <div className="col-span-full h-16 lg:hidden pointer-events-none"></div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: POS Cart & Checkout Summary */}
            <div className={`space-y-6 ${mobilePosTab === 'cart' ? 'block' : 'hidden lg:block'}`}>
              
              <div className="bg-white rounded-3xl p-6 border-2 border-brand-500 shadow-card space-y-5 sticky top-6">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-warm-muted pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMobilePosTab('products')}
                      className="p-1 text-charcoal-500 hover:text-brand-600 lg:hidden"
                      title="Back to products"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-sm font-black text-charcoal-900 uppercase tracking-wider flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-brand-600" />
                      <span>POS Counter Cart ({cart.length})</span>
                    </h3>
                  </div>

                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={handleResetNewBill}
                      className="text-[10px] font-extrabold text-rose-600 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset New Bill</span>
                    </button>
                  )}
                </div>

                {/* Cart Items List */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-charcoal-400 space-y-2">
                      <Package className="w-10 h-10 mx-auto text-warm-border" />
                      <p className="text-xs font-bold">Cart is empty. Tap any product on the catalog to add.</p>
                      <button
                        type="button"
                        onClick={() => setMobilePosTab('products')}
                        className="text-xs font-extrabold text-brand-600 hover:underline lg:hidden"
                      >
                        ← Go to Products Catalog
                      </button>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="bg-warm-bg/90 p-3 rounded-2xl border border-warm-border space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-black text-charcoal-900 truncate">{item.product.name_en}</h5>
                            {item.pricing_type === 'weight' && item.weight_calculation && (
                              <span className="text-[10px] font-extrabold text-amber-700 block">
                                ⚖️ {item.weight_calculation.total_weight_kg} kg @ ₹{item.weight_calculation.rate_per_kg}/kg
                              </span>
                            )}
                            {item.pricing_type === 'sqft' && item.sqft_calculation && (
                              <span className="text-[10px] font-extrabold text-blue-700 block">
                                📐 {item.sqft_calculation.total_sqft} sqft @ ₹{item.sqft_calculation.rate_per_sqft}/sqft
                              </span>
                            )}
                            {item.pricing_type === 'fixed' && (
                              <span className="text-[10px] font-extrabold text-emerald-700 block">
                                🏷️ Fixed Unit Price
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Unit Price & Item Discount Controls */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-warm-muted/60 text-xs">
                          <div>
                            <label className="block text-[9px] font-bold text-charcoal-500 uppercase mb-0.5">
                              {isTamil ? 'பொருளின் விலை (₹)' : 'Unit Price (₹)'}
                            </label>
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => handleUpdateCartItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1 text-xs font-mono font-extrabold border border-warm-border rounded-lg bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-charcoal-500 uppercase mb-0.5">
                              {isTamil ? 'பொருள் தள்ளுபடி (₹)' : 'Item Discount (₹)'}
                            </label>
                            <input
                              type="number"
                              value={item.discount || ''}
                              onChange={(e) => handleUpdateCartItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                              placeholder="₹0"
                              className="w-full px-2 py-1 text-xs font-mono font-extrabold border border-warm-border rounded-lg bg-white text-rose-600"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1 font-mono text-xs font-black text-charcoal-900 border-t border-warm-muted/40">
                          <span className="text-[11px] text-charcoal-600">Line Total:</span>
                          <span>₹{item.line_total.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Clean Flat Ledger (Subtotal, Overall Discount, Grand Total) */}
                {cart.length > 0 && (
                  <div className="space-y-2.5 pt-3 border-t border-warm-muted text-xs">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center font-bold text-charcoal-700">
                      <span>{isTamil ? 'கூட்டுத்தொகை' : 'Subtotal'}:</span>
                      <span className="font-mono font-black text-sm text-charcoal-900">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Overall Bill Discount */}
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-[11px] font-extrabold text-rose-700 uppercase shrink-0">
                        {isTamil ? 'ஒட்டுமொத்த தள்ளுபடி (₹)' : 'Overall Bill Discount (₹)'}:
                      </label>
                      <div className="w-28">
                        <input
                          type="number"
                          value={cartDiscount || ''}
                          onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0)}
                          placeholder="₹ 0"
                          className="w-full px-2.5 py-1 text-xs font-mono font-black border border-warm-border rounded-lg bg-white text-rose-600 text-right focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    </div>

                    {/* Grand Total */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-warm-muted">
                      <span className="text-xs font-black text-charcoal-900 uppercase">
                        {isTamil ? 'மொத்த பில் தொகை' : 'Grand Total Bill'}:
                      </span>
                      <span className="text-2xl font-black font-mono text-brand-600">
                        ₹{finalCartGrandTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Payment Mode Selection */}
                <div className="space-y-3 pt-2 border-t border-warm-muted">
                  <label className="block text-[11px] font-black text-charcoal-800 uppercase tracking-wider">
                    {isTamil ? 'பணம் செலுத்தும் முறை' : 'Payment Method'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('cash')}
                      className={`py-2.5 rounded-xl text-xs font-black border transition-all ${
                        paymentMode === 'cash'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-warm-bg text-charcoal-700 border-warm-border hover:bg-warm-hover'
                      }`}
                    >
                      💵 {isTamil ? 'ரொக்கம்' : 'Cash Payment'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMode('upi');
                        if (cart.length > 0) setShowUpiModal(true);
                      }}
                      className={`py-2.5 rounded-xl text-xs font-black border transition-all ${
                        paymentMode === 'upi'
                          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                          : 'bg-warm-bg text-charcoal-700 border-warm-border hover:bg-warm-hover'
                      }`}
                    >
                      📲 {isTamil ? 'UPI QR ஸ்கேன்' : 'UPI QR Code'}
                    </button>
                  </div>

                  {/* Amount Collected & Change Calculator */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black text-charcoal-700 uppercase mb-1">
                        {isTamil ? 'பெற்ற தொகை / முன்பணம் (₹)' : 'Advance / Cash Received (₹)'}
                      </label>
                      <input
                        type="number"
                        value={amountPaid || ''}
                        onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                        placeholder={`Full: ₹${finalCartGrandTotal}`}
                        className="w-full px-3 py-2 text-xs font-mono font-black border border-warm-border rounded-xl bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-charcoal-700 uppercase mb-1">
                        {changeBalance >= 0 ? (isTamil ? 'மீதி கொடுக்க (₹)' : 'Change / Return (₹)') : (isTamil ? 'மீதி வசூலிக்க (₹)' : 'Balance Due (₹)')}
                      </label>
                      <div className={`px-3 py-2 rounded-xl border font-mono font-black text-xs text-center ${
                        changeBalance >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {changeBalance >= 0 ? `+ ₹${changeBalance.toLocaleString('en-IN')}` : `Due: ₹${Math.abs(changeBalance).toLocaleString('en-IN')}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complete Sale Button */}
                <div className="pt-2">
                  {paymentMode === 'upi' ? (
                    <Button
                      type="button"
                      onClick={() => setShowUpiModal(true)}
                      variant="primary"
                      fullWidth
                      disabled={cart.length === 0}
                      icon={<QrCode className="w-4 h-4" />}
                      className="py-3 text-sm font-black rounded-2xl shadow-lg bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isTamil ? 'QR குறியீட்டைக் காட்டி முடி' : 'Show UPI QR & Complete Sale'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => handleCompleteSale()}
                      variant="primary"
                      fullWidth
                      disabled={cart.length === 0}
                      icon={<Printer className="w-4 h-4" />}
                      className="py-3 text-sm font-black rounded-2xl shadow-lg"
                    >
                      {isTamil ? 'பில் அச்சிட்டு முடிக்க' : 'Complete Sale & Print Bill'}
                    </Button>
                  )}
                </div>

              </div>

            </div>

          </div>

          {/* FLOATING STICKY MOBILE BOTTOM BAR (Shows when on Products tab with items in cart) */}
          {mobilePosTab === 'products' && cart.length > 0 && (
            <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden bg-brand-600 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between font-black border-2 border-brand-400">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <div>
                  <span className="text-xs font-black block">{cart.length} Item(s) in Cart</span>
                  <span className="text-sm font-mono font-black">₹{finalCartGrandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobilePosTab('cart')}
                className="bg-white text-brand-700 hover:bg-amber-50 px-4 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-colors"
              >
                <span>Go to Cart & Pay</span>
                <span>→</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* POS HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-sm font-black text-charcoal-900 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-brand-600" />
              <span>Offline Counter Sales History ({filteredHistory.length})</span>
            </h3>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search by Order #, Name, Mobile..."
                className="w-full pl-8 pr-3 py-1.5 text-xs font-bold border border-warm-border rounded-xl bg-warm-bg"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-bg text-charcoal-500 font-extrabold border-b border-warm-border uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Mobile No</th>
                  <th className="py-2.5 px-3">Product Item</th>
                  <th className="py-2.5 px-3">Total (₹)</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-muted font-medium">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-charcoal-400 font-bold">
                      No POS sales records found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((ord) => (
                    <tr key={ord.id} className="hover:bg-warm-hover transition-colors">
                      <td className="py-3 px-3 font-mono font-black text-brand-600">{ord.order_number}</td>
                      <td className="py-3 px-3 font-mono text-charcoal-600">
                        {ord.created_at ? new Date(ord.created_at).toLocaleString('en-IN') : 'Recent'}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-charcoal-900">{ord.customer_name || ord.customerName || 'Walk-in Customer'}</td>
                      <td className="py-3 px-3 font-mono text-charcoal-700">{ord.customer_phone || ord.customerPhone || '-'}</td>
                      <td className="py-3 px-3 font-semibold text-charcoal-800">{ord.product_name || ord.productName || ord.specifications || 'Lathe Item'}</td>
                      <td className="py-3 px-3 font-black font-mono text-charcoal-900">₹{(ord.total_amount || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3">
                        <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                          {ord.payment_status?.toUpperCase() || 'PAID'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/invoice/${ord.order_number || ord.id}`)}
                            className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-2.5 py-1 rounded-xl text-[11px] shadow-sm transition-colors inline-flex items-center gap-1"
                            title="Print Invoice"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Print</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShareWhatsAppBill(ord)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold p-1.5 rounded-xl text-[11px] shadow-sm transition-colors inline-flex items-center"
                            title="Share on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShareSMSBill(ord)}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold p-1.5 rounded-xl text-[11px] shadow-sm transition-colors inline-flex items-center"
                            title="Send SMS"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingHistoryOrder(ord)}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold p-1.5 rounded-xl text-[11px] shadow-sm transition-colors inline-flex items-center"
                            title="Edit Order Record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletePosOrderId(ord.id)}
                            className="bg-rose-50 text-rose-600 hover:bg-rose-100 p-1.5 rounded-xl text-[11px] border border-rose-200 transition-colors inline-flex items-center"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POS WEIGHT CALCULATOR MODAL - CLEAN & CRISP */}
      {weightModalProduct && (
        <Modal
          isOpen={Boolean(weightModalProduct)}
          onClose={() => setWeightModalProduct(null)}
          title={`Calculate Custom Weight - ${weightModalProduct.name_en}`}
          maxWidth="md"
        >
          <div className="space-y-5 py-2">
            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-amber-900 shadow-sm">
              <div className="flex items-center gap-2">
                <label className="font-black uppercase tracking-wider text-[11px] shrink-0 text-amber-950">
                  Rate Per KG (₹/kg):
                </label>
                <div className="flex items-center gap-1">
                  <span className="font-black text-amber-900 text-sm">₹</span>
                  <input
                    type="number"
                    value={modalRatePerKg || ''}
                    onChange={(e) => setModalRatePerKg(parseFloat(e.target.value) || 0)}
                    placeholder="160"
                    className="w-28 px-3 py-1.5 text-xs font-mono font-black border-2 border-amber-400 rounded-xl text-right bg-white text-amber-950 focus:ring-2 focus:ring-amber-500 shadow-sm"
                  />
                  <span className="font-bold text-amber-800 text-xs">/ kg</span>
                </div>
              </div>

              <span className="text-xs font-black text-amber-900 bg-amber-100/80 px-3 py-1 rounded-xl border border-amber-200">
                Product: {weightModalProduct.name_en}
              </span>
            </div>

            {/* Weights List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-charcoal-800 uppercase tracking-wider">
                  Fabrication Weights (KG) *
                </span>
                <button
                  type="button"
                  onClick={() => setModalParts([
                    ...modalParts, 
                    { name: '', weight_kg: '' }
                  ])}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Piece Weight</span>
                </button>
              </div>

              {modalParts.map((pt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="number"
                      value={pt.weight_kg}
                      onChange={(e) => {
                        const updated = [...modalParts];
                        updated[idx].weight_kg = e.target.value ? parseFloat(e.target.value) : '';
                        setModalParts(updated);
                      }}
                      placeholder="Weight in KG *"
                      className="w-full px-3.5 py-2 text-xs font-mono font-black border border-warm-border rounded-lg bg-white focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="text-xs font-mono font-bold text-charcoal-500">kg</span>
                  </div>

                  <input
                    type="text"
                    value={pt.name}
                    onChange={(e) => {
                      const updated = [...modalParts];
                      updated[idx].name = e.target.value;
                      setModalParts(updated);
                    }}
                    placeholder="Part Description (Optional)"
                    className="flex-1 px-3.5 py-2 text-xs font-bold border border-warm-border rounded-lg bg-white text-charcoal-900 focus:ring-2 focus:ring-brand-500"
                  />

                  {modalParts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setModalParts(modalParts.filter((_, i) => i !== idx))}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Extra Charges */}
            <div className="space-y-3 pt-3 border-t border-warm-muted">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-charcoal-800 uppercase tracking-wider">
                  Extra Charges (Lock, Fitting, Paint, etc.)
                </span>
                <button
                  type="button"
                  onClick={() => setModalExtraCharges([...modalExtraCharges, { description: '', amount: '' }])}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Extra Charge</span>
                </button>
              </div>

              {modalExtraCharges.length === 0 ? (
                <p className="text-[11px] text-charcoal-400 italic">No extra charges added. Click above to add outsourced items if needed.</p>
              ) : (
                modalExtraCharges.map((ext, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ext.description}
                      onChange={(e) => {
                        const updated = [...modalExtraCharges];
                        updated[idx].description = e.target.value;
                        setModalExtraCharges(updated);
                      }}
                      placeholder="Expense Description"
                      className="flex-1 px-3.5 py-2 text-xs font-extrabold border border-warm-border rounded-lg bg-white focus:ring-2 focus:ring-brand-500"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={ext.amount}
                        onChange={(e) => {
                          const updated = [...modalExtraCharges];
                          updated[idx].amount = e.target.value ? parseFloat(e.target.value) : '';
                          setModalExtraCharges(updated);
                        }}
                        placeholder="₹ Amount"
                        className="w-32 px-3.5 py-2 text-xs font-mono font-black border border-warm-border rounded-lg text-right bg-white focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalExtraCharges(modalExtraCharges.filter((_, i) => i !== idx))}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Calculation Summary Footer with DISCOUNT AMOUNT */}
            {(() => {
              const totalW = modalParts.reduce((s, p) => s + (Number(p.weight_kg) || 0), 0);
              const wCost = Math.round(totalW * modalRatePerKg);
              const eCost = modalExtraCharges.reduce((s, c) => s + (Number(c.amount) || 0), 0);
              const subtotalCost = wCost + eCost;
              const displayTotal = Math.max(0, subtotalCost - modalDiscount);

              return (
                <div className="pt-3 border-t border-warm-muted space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-brand-50 p-4 rounded-2xl border border-brand-200">
                    <div>
                      <span className="text-[10px] font-black text-brand-800 uppercase tracking-widest block">Total Weight</span>
                      <span className="text-xl font-black font-mono text-brand-900">{totalW} KG</span>
                      <span className="text-[10px] text-charcoal-500 font-bold block">Base: ₹{wCost.toLocaleString('en-IN')}</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-rose-800 uppercase tracking-widest mb-1">
                        Discount Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={modalDiscount || ''}
                        onChange={(e) => setModalDiscount(parseFloat(e.target.value) || 0)}
                        placeholder="Discount ₹"
                        className="w-full px-3 py-1.5 text-sm font-mono font-black border border-rose-300 rounded-xl bg-white text-rose-600 focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="bg-brand-600 text-white p-4 rounded-2xl flex justify-between items-center font-black shadow-md">
                    <span className="text-xs uppercase tracking-wider">CALCULATED FABRICATION TOTAL:</span>
                    <span className="text-2xl font-mono">₹{displayTotal.toLocaleString('en-IN')}</span>
                  </div>

                  <Button type="button" onClick={handleAddWeightItemToCart} variant="primary" fullWidth className="py-3 text-sm font-black rounded-2xl">
                    Confirm & Add to POS Cart
                  </Button>
                </div>
              );
            })()}
          </div>
        </Modal>
      )}

      {/* POS SQFT CALCULATOR MODAL */}
      {sqftModalProduct && (
        <Modal
          isOpen={Boolean(sqftModalProduct)}
          onClose={() => setSqftModalProduct(null)}
          title={`Calculate Square Feet - ${sqftModalProduct.name_en}`}
          maxWidth="md"
        >
          <div className="space-y-4 py-2 text-xs font-bold">
            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200 text-blue-900 flex justify-between">
              <span>Rate Per SqFt: ₹{sqftRate}/sqft</span>
              <span>Height x Width Area Calculation</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-charcoal-700 mb-1">Height (Feet)</label>
                <input
                  type="number"
                  value={sqftHeight}
                  onChange={(e) => setSqftHeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono font-black border border-warm-border rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-charcoal-700 mb-1">Width (Feet)</label>
                <input
                  type="number"
                  value={sqftWidth}
                  onChange={(e) => setSqftWidth(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono font-black border border-warm-border rounded-lg bg-white"
                />
              </div>
            </div>

            {(() => {
              const totalSqFt = Math.round(sqftHeight * sqftWidth * 100) / 100;
              const gTotal = Math.round(totalSqFt * sqftRate);
              return (
                <div className="pt-3 border-t space-y-3">
                  <div className="bg-blue-600 text-white p-4 rounded-2xl flex justify-between items-center font-black">
                    <span>Total Area ({totalSqFt} SqFt):</span>
                    <span className="text-2xl font-mono">₹{gTotal.toLocaleString('en-IN')}</span>
                  </div>

                  <Button type="button" onClick={handleAddSqftItemToCart} variant="primary" fullWidth className="py-3 text-sm font-black">
                    Confirm & Add to POS Cart
                  </Button>
                </div>
              );
            })()}
          </div>
        </Modal>
      )}

      {/* DYNAMIC UPI PAYMENT POPUP MODAL */}
      {showUpiModal && (
        <Modal
          isOpen={showUpiModal}
          onClose={() => setShowUpiModal(false)}
          title="UPI Payment QR Code & Counter Receipt"
          maxWidth="sm"
        >
          <div className="text-center py-3 space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs font-bold text-amber-900">
              <span>Ask customer to scan using GPay, PhonePe, or Paytm</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border-2 border-brand-500 shadow-md inline-block">
              <img
                src={upiQrCodeUrl}
                alt="MANIKANDAN LATHE UPI QR Code"
                className="w-56 h-56 mx-auto rounded-xl"
              />
              <span className="text-xs font-black font-mono text-brand-600 block mt-2">
                UPI ID: 9659286268@upi
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-extrabold text-charcoal-500 uppercase">AMOUNT PAYABLE</span>
              <h3 className="text-2xl font-black font-mono text-emerald-600">
                ₹{finalCartGrandTotal.toLocaleString('en-IN')}
              </h3>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => handleCompleteSale('upi')}
                variant="primary"
                fullWidth
                icon={<CheckCircle2 className="w-4 h-4" />}
                className="py-3 text-xs font-black rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-md"
              >
                Mark as Paid & Complete Sale
              </Button>

              <button
                type="button"
                onClick={() => setShowUpiModal(false)}
                className="w-full py-2.5 rounded-2xl text-xs font-bold text-charcoal-600 hover:bg-warm-hover"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CUSTOM LATHE / MACHINING / WELDING WORK MODAL (Clean Name & Amount Only) */}
      {showCustomItemModal && (
        <Modal
          isOpen={showCustomItemModal}
          onClose={() => setShowCustomItemModal(false)}
          title={isTamil ? 'தனிப்பயன் லேத் வேலை' : 'Custom Lathe / Repair Work'}
          maxWidth="xs"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddCustomLatheItem();
            }}
            className="space-y-4 py-2"
          >
            {/* 1. Job Description / Name Input (Optional) */}
            <div>
              <label className="block text-xs font-black text-charcoal-700 mb-1">
                {isTamil ? 'வேலையின் பெயர் (விருப்பத்திற்குரியது)' : 'Item / Job Name (Optional)'}
              </label>
              <input
                type="text"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                placeholder={isTamil ? 'தனிப்பயன் லேத் வேலை' : 'Custom Lathe Work'}
                className="w-full px-3.5 py-2.5 text-xs font-bold border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* 2. Amount Input (Required) */}
            <div>
              <label className="block text-xs font-black text-purple-900 mb-1">
                {isTamil ? 'தொகை / கட்டணம் (₹) *' : 'Amount / Rate (₹) *'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold font-mono text-purple-700 text-base">₹</span>
                <input
                  type="number"
                  autoFocus
                  required
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value ? parseFloat(e.target.value) : '')}
                  placeholder="500"
                  className="w-full pl-8 pr-3.5 py-2.5 text-base font-mono font-black border-2 border-purple-400 rounded-xl bg-purple-50/40 text-purple-950 focus:ring-2 focus:ring-purple-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Button type="button" onClick={() => setShowCustomItemModal(false)} variant="secondary" fullWidth>
                {isTamil ? 'ரத்து' : 'Cancel'}
              </Button>
              <Button type="submit" variant="primary" fullWidth icon={<Plus className="w-4 h-4" />} className="bg-purple-600 hover:bg-purple-700">
                {isTamil ? 'பில்லில் சேர்க்க' : 'Add to Bill'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* POS SALE SUCCESSFUL MODAL WITH PRINT & WHATSAPP & NEW BILL */}
      {lastCreatedOrder && (
        <Modal
          isOpen={Boolean(lastCreatedOrder)}
          onClose={() => setLastCreatedOrder(null)}
          title={isTamil ? 'கவுண்டர் பில் வெற்றிகரமாக உருவாக்கப்பட்டது!' : 'POS Counter Sale Completed Successfully!'}
          maxWidth="sm"
        >
          <div className="text-center py-4 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-black text-brand-600 block">BILL NO: #{lastCreatedOrder.order_number}</span>
              <h3 className="text-xl font-black text-charcoal-900">₹{(lastCreatedOrder.total_amount || 0).toLocaleString('en-IN')}</h3>
              <p className="text-xs font-bold text-charcoal-600">
                Customer: {lastCreatedOrder.customerName} ({lastCreatedOrder.customerPhone})
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => {
                  const targetId = lastCreatedOrder.order_number || lastCreatedOrder.id;
                  window.open(`/admin/invoice/${targetId}`, '_blank');
                }}
                variant="primary"
                fullWidth
                icon={<Printer className="w-4 h-4" />}
                className="py-3 text-xs font-black rounded-2xl shadow-md"
              >
                {isTamil ? 'முழு A4 பில் அச்சிடு (A4 Invoice)' : 'Print Full A4 Invoice'}
              </Button>

              <button
                type="button"
                onClick={() => setShowThermalModal(true)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 px-4 rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>{isTamil ? '3-இன்ச் தெர்மல் ரசீது அச்சிடு' : 'Print 3-Inch Thermal Slip'}</span>
              </button>

              <Button
                onClick={() => handleShareWhatsAppBill(lastCreatedOrder)}
                variant="secondary"
                fullWidth
                icon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
                className="py-2.5 text-xs font-black rounded-2xl"
              >
                {isTamil ? 'வாட்ஸ்அப்பில் ரசீது அனுப்பு' : 'Share Bill via WhatsApp'}
              </Button>

              <button
                onClick={() => {
                  setLastCreatedOrder(null);
                  setShowThermalModal(false);
                }}
                className="w-full bg-warm-bg hover:bg-warm-hover text-charcoal-700 font-extrabold py-2.5 px-4 rounded-2xl text-xs border border-warm-border transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4 text-brand-600" />
                <span>{isTamil ? 'புதிய பில் தொடங்க' : 'Start New Bill'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3-INCH THERMAL SLIP PREVIEW & DIRECT PRINT MODAL */}
      {showThermalModal && lastCreatedOrder && (
        <Modal
          isOpen={showThermalModal}
          onClose={() => setShowThermalModal(false)}
          title={isTamil ? '3-இன்ச் தெர்மல் ரசீது' : '3-Inch Thermal Slip Preview'}
          maxWidth="sm"
        >
          <div className="space-y-4 py-2">
            {/* Thermal Printable Slip Area */}
            <div id="thermal-pos-slip" className="bg-white p-4 border border-charcoal-300 rounded-xl shadow-inner text-charcoal-900 font-mono text-[11px] leading-relaxed max-w-[280px] mx-auto text-center">
              <h3 className="font-black text-sm uppercase tracking-wider">MANIKANDAN LATHE</h3>
              <p className="text-[10px] text-charcoal-600">Welding & Lathe Works</p>
              <p className="text-[10px] text-charcoal-500">Kallimandhayam - 624616</p>
              <p className="text-[10px] text-charcoal-500">Ph: 9659286268</p>
              <div className="border-b border-dashed border-charcoal-400 my-2"></div>
              
              <div className="text-left space-y-0.5 text-[10px]">
                <p><strong>Bill #:</strong> {lastCreatedOrder.order_number}</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString('en-IN')}</p>
                <p><strong>Cust:</strong> {lastCreatedOrder.customerName}</p>
                <p><strong>Phone:</strong> {lastCreatedOrder.customerPhone}</p>
              </div>

              <div className="border-b border-dashed border-charcoal-400 my-2"></div>

              {/* Items List */}
              <div className="text-left space-y-1">
                {lastCreatedOrder.items && lastCreatedOrder.items.length > 0 ? (
                  lastCreatedOrder.items.map((it: any, iIdx: number) => (
                    <div key={iIdx} className="flex justify-between">
                      <span className="truncate max-w-[170px]">{iIdx + 1}. {it.name} (x{it.quantity})</span>
                      <span className="font-black">₹{it.total}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between">
                    <span>1. {lastCreatedOrder.productName}</span>
                    <span className="font-black">₹{lastCreatedOrder.total_amount}</span>
                  </div>
                )}
              </div>

              <div className="border-b border-dashed border-charcoal-400 my-2"></div>

              {/* Total & Paid */}
              <div className="text-left space-y-0.5 font-bold">
                <div className="flex justify-between text-xs font-black">
                  <span>TOTAL:</span>
                  <span>₹{lastCreatedOrder.total_amount?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>PAID:</span>
                  <span>₹{(lastCreatedOrder.advance_amount || lastCreatedOrder.total_amount)?.toLocaleString('en-IN')}</span>
                </div>
                {Number(lastCreatedOrder.remaining_amount) > 0 && (
                  <div className="flex justify-between text-rose-700 font-black">
                    <span>BALANCE DUE:</span>
                    <span>₹{lastCreatedOrder.remaining_amount?.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div className="border-b border-dashed border-charcoal-400 my-2"></div>
              <p className="text-[9px] text-charcoal-500 font-bold">Counter Pickup (Kallimandhayam)</p>
              <p className="text-[9px] text-charcoal-400">*** Thank You! Visit Again ***</p>
            </div>

            {/* Print Trigger */}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                onClick={() => window.print()}
                variant="primary"
                fullWidth
                icon={<Printer className="w-4 h-4" />}
              >
                {isTamil ? 'அச்சிடு (Print Slip)' : 'Print Thermal Slip'}
              </Button>
              <Button
                type="button"
                onClick={() => setShowThermalModal(false)}
                variant="secondary"
                fullWidth
              >
                {isTamil ? 'மூடு' : 'Close'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* EDIT HISTORY ORDER MODAL */}
      {editingHistoryOrder && (
        <Modal
          isOpen={Boolean(editingHistoryOrder)}
          onClose={() => setEditingHistoryOrder(null)}
          title={`Edit POS Sale #${editingHistoryOrder.order_number}`}
          maxWidth="sm"
        >
          <form onSubmit={handleSaveHistoryOrderEdit} className="space-y-4 py-2 text-xs">
            <div>
              <label className="block font-bold text-charcoal-700 mb-1">Total Order Amount (₹)</label>
              <input
                type="number"
                value={editingHistoryOrder.total_amount || 0}
                onChange={(e) => {
                  const tot = parseFloat(e.target.value) || 0;
                  setEditingHistoryOrder({
                    ...editingHistoryOrder,
                    total_amount: tot,
                    remaining_amount: Math.max(0, tot - (editingHistoryOrder.advance_amount || 0))
                  });
                }}
                className="w-full px-3 py-2 font-mono font-bold border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-charcoal-700 mb-1">Amount Paid / Collected (₹)</label>
              <input
                type="number"
                value={editingHistoryOrder.advance_amount || 0}
                onChange={(e) => {
                  const paid = parseFloat(e.target.value) || 0;
                  const tot = editingHistoryOrder.total_amount || 0;
                  setEditingHistoryOrder({
                    ...editingHistoryOrder,
                    advance_amount: paid,
                    remaining_amount: Math.max(0, tot - paid),
                    payment_status: (tot - paid) <= 0 ? 'paid' : 'partially_paid'
                  });
                }}
                className="w-full px-3 py-2 font-mono font-bold border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-charcoal-700 mb-1">Payment Status</label>
              <select
                value={editingHistoryOrder.payment_status || 'paid'}
                onChange={(e) => setEditingHistoryOrder({ ...editingHistoryOrder, payment_status: e.target.value })}
                className="w-full px-3 py-2 font-bold border rounded-xl"
              >
                <option value="paid">PAID (Full Payment)</option>
                <option value="partially_paid">PARTIALLY PAID</option>
                <option value="pending">PENDING</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-charcoal-700 mb-1">Admin Notes</label>
              <textarea
                value={editingHistoryOrder.admin_notes || ''}
                onChange={(e) => setEditingHistoryOrder({ ...editingHistoryOrder, admin_notes: e.target.value })}
                className="w-full px-3 py-2 font-medium border rounded-xl"
                rows={2}
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button type="button" onClick={() => setEditingHistoryOrder(null)} variant="secondary" fullWidth>
                Cancel
              </Button>
              <Button type="submit" variant="primary" fullWidth icon={<CheckCircle2 className="w-4 h-4" />}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* CUSTOM CARD POPUP NOTIFICATION MODAL (Replaces default browser alert) */}
      <NotificationModal
        isOpen={notifyModal.isOpen}
        onClose={() => setNotifyModal((prev) => ({ ...prev, isOpen: false }))}
        title={notifyModal.title}
        message={notifyModal.message}
        type={notifyModal.type}
      />

      {/* CUSTOM CONFIRMATION MODAL */}
      {/* CUSTOM CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={Boolean(deletePosOrderId)}
        onClose={() => setDeletePosOrderId(null)}
        onConfirm={confirmDeleteHistoryOrder}
        title="Delete POS Sale Record?"
        message="Are you sure you want to delete this POS counter sale record from history? This action cannot be undone."
        confirmText="Delete Sale Record"
        isDanger={true}
      />

      {/* PRODUCT VOICE SEARCH MODAL */}
      <VoiceSearchModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onTranscript={(text) => setProductSearch(text)}
      />

      {/* CUSTOMER VOICE SEARCH MODAL */}
      <VoiceSearchModal
        isOpen={showCustomerVoiceModal}
        onClose={() => setShowCustomerVoiceModal(false)}
        onTranscript={(text) => {
          setCustomerSearch(text);
          setShowCustomerDropdown(true);
        }}
      />

    </div>
  );
};
