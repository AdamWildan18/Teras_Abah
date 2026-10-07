import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '../api/transactionApi';
import api from '../../../lib/axios';
import { toast } from 'sonner';
import { 
  ShoppingCart, Search, Plus, Minus, Trash2, 
  CreditCard, Banknote, QrCode, Smartphone,
  X, Loader2, UtensilsCrossed, Bike, Percent, Check
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Receipt from '../../../components/Receipt';

export default function CashierPage() {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('dine_in');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  
  // Add-On states
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);
  const [currentCartItem, setCurrentCartItem] = useState(null);

  const queryClient = useQueryClient();

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.get('/products/all'),
  });

  // Fetch add-ons
  const { data: addOnsData } = useQuery({
    queryKey: ['add-ons'],
    queryFn: () => api.get('/add-ons'),
  });

  const products = productsData?.data?.data || productsData?.data || [];
  const availableAddOns = addOnsData?.data?.data || addOnsData?.data || [];

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Hitung total add-ons untuk satu item
  const getAddOnTotal = (cartItem) => {
    return (cartItem.add_ons || []).reduce((sum, addOn) => sum + parseFloat(addOn.price || 0), 0);
  };

  // Hitung total item (produk + add-ons) × qty
  const getItemTotal = (cartItem) => {
    const basePrice = parseFloat(cartItem.price || 0) * cartItem.qty;
    const addOnTotal = getAddOnTotal(cartItem) * cartItem.qty;
    return basePrice + addOnTotal;
  };

  const subtotal = cart.reduce((sum, item) => sum + getItemTotal(item), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const total = subtotal - discountAmount;
  const change = paidAmount - total;

  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.warning(`Stok ${product.name} habis`);
      return;
    }

    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      if (existingItem.qty >= product.stock) {
        toast.warning(`Stok ${product.name} tidak mencukupi`);
        return;
      }
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, qty: item.qty + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        qty: 1,
        add_ons: [],
        notes: '',
      }]);
    }
  };

  const updateQty = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.qty + delta;
        if (newQty <= 0) return item;
        
        const product = products.find(p => p.id === productId);
        if (product && newQty > product.stock) {
          toast.warning(`Stok ${product.name} tidak mencukupi`);
          return item;
        }
        
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  // Add-On functions
  const openAddOnModal = (cartItem) => {
    setCurrentCartItem(cartItem);
    setIsAddOnModalOpen(true);
  };

  const toggleAddOn = (addOn) => {
    const currentAddOns = currentCartItem.add_ons || [];
    const exists = currentAddOns.find(a => a.id === addOn.id);
    
    // ✅ Validasi stok add-on
    if (!exists && addOn.stock <= 0) {
      toast.warning(`Stok ${addOn.name} habis`);
      return;
    }

    let newAddOns;
    if (exists) {
      newAddOns = currentAddOns.filter(a => a.id !== addOn.id);
    } else {
      newAddOns = [...currentAddOns, addOn];
    }
    
    setCart(cart.map(item => 
      item.product_id === currentCartItem.product_id
        ? { ...item, add_ons: newAddOns }
        : item
    ));
    
    setCurrentCartItem({ ...currentCartItem, add_ons: newAddOns });
  };

  const checkoutMutation = useMutation({
    mutationFn: (data) => transactionApi.create(data),
    onSuccess: (response) => {
      toast.success('Transaksi berhasil!');
      
      const transactionData = response.data?.data || response.data;
      setLastTransaction(transactionData);
      setShowReceipt(true);
      
      setCart([]);
      setCustomerName('');
      setOrderType('dine_in');
      setPaidAmount(0);
      setDiscountPercent(0);
      setIsPaymentOpen(false);
      
      queryClient.invalidateQueries({ queryKey: ['products-all'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal memproses transaksi');
    },
  });

  const handlePayment = () => {
    if (paidAmount < total) {
      toast.error('Uang pembayaran kurang!');
      return;
    }

    checkoutMutation.mutate({
      items: cart,
      customer_name: customerName || null,
      order_type: orderType,
      payment_method: paymentMethod,
      paid: paidAmount,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      total: total,
    });
  };

  const paymentMethods = [
    { id: 'cash', label: 'Tunai', icon: Banknote },
    { id: 'qris', label: 'QRIS', icon: QrCode },
    { id: 'transfer', label: 'Transfer', icon: Smartphone },
    { id: 'debit', label: 'Debit', icon: CreditCard },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left: Product Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kasir / Point of Sale</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Pilih produk untuk ditambahkan ke keranjang</p>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-20">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Tidak ada produk tersedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition text-left ${
                  product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center text-4xl">
                  🍲
                </div>
                <h3 className="font-bold text-sm mb-1 text-gray-900 dark:text-white">{product.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{product.code}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-600 dark:text-amber-400">{formatRupiah(product.price)}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    product.stock <= 0 
                      ? 'bg-red-100 text-red-600' 
                      : product.stock <= 5 
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    Stok: {product.stock}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
            <ShoppingCart className="w-5 h-5" />
            Keranjang ({cart.length})
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-10">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Keranjang kosong</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.product_id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white">{item.product_name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatRupiah(item.price)}</p>
                      
                      {item.add_ons && item.add_ons.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.add_ons.map(addOn => (
                            <span key={addOn.id} className="inline-block text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">
                              + {addOn.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.product_id, -1)}
                        className="w-6 h-6 rounded bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-sm w-8 text-center text-gray-900 dark:text-white">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.product_id, 1)}
                        className="w-6 h-6 rounded bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAddOnModal(item)}
                        className="text-xs bg-amber-500 text-white px-2 py-1 rounded hover:bg-amber-600 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add-On
                      </button>
                      <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                        {formatRupiah(getItemTotal(item))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <input
            type="text"
            placeholder="Nama pelanggan (opsional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setOrderType('dine_in')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                orderType === 'dine_in' ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <UtensilsCrossed className="w-3 h-3" /> Dine In
            </button>
            <button
              onClick={() => setOrderType('take_away')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                orderType === 'take_away' ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              Take Away
            </button>
            <button
              onClick={() => setOrderType('delivery')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                orderType === 'delivery' ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Bike className="w-3 h-3" /> Delivery
            </button>
          </div>

          {/* Discount */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1">
              <Percent className="w-3 h-3" /> Diskon (%)
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center font-bold"
              />
              <span className="text-gray-700 dark:text-gray-300">%</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                Potongan: {formatRupiah(discountAmount)}
              </span>
            </div>
            <div className="flex gap-2">
              {[0, 5, 10, 15, 20].map((p) => (
                <button
                  key={p}
                  onClick={() => setDiscountPercent(p)}
                  className={`flex-1 py-1 text-xs font-medium rounded ${
                    discountPercent === p ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 text-sm border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatRupiah(subtotal)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>Diskon ({discountPercent}%)</span>
                <span className="font-medium">- {formatRupiah(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-amber-600 dark:text-amber-400">{formatRupiah(total)}</span>
            </div>
          </div>

          <Button onClick={() => setIsPaymentOpen(true)} disabled={cart.length === 0} className="w-full" size="lg">
            Bayar Sekarang
          </Button>
        </div>
      </div>

      {/* Add-On Modal */}
      {isAddOnModalOpen && currentCartItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Add-On: {currentCartItem.product_name}
              </h3>
              <button onClick={() => setIsAddOnModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableAddOns.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Tidak ada add-on tersedia</p>
              ) : (
                availableAddOns.map(addOn => {
                  const isSelected = (currentCartItem.add_ons || []).some(a => a.id === addOn.id);
                  return (
                    <button
                      key={addOn.id}
                      onClick={() => toggleAddOn(addOn)}
                      className={`w-full p-3 rounded-lg border-2 flex items-center justify-between transition ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected ? 'bg-amber-500 border-amber-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{addOn.name}</span>
                      </div>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        +{formatRupiah(addOn.price)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-gray-700 dark:text-gray-300">Total Add-On:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {formatRupiah(getAddOnTotal(currentCartItem))}
                </span>
              </div>
              <Button onClick={() => setIsAddOnModalOpen(false)} className="w-full">
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Pembayaran</h3>
              <button onClick={() => setIsPaymentOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mb-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Pembayaran</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{formatRupiah(total)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Metode Pembayaran</label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                        paymentMethod === method.id
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Uang Diterima</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-bold"
                  placeholder="0"
                  autoFocus
                />
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[50000, 100000, 200000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setPaidAmount(amount)}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                    >
                      {formatRupiah(amount)}
                    </button>
                  ))}
                </div>
                {paidAmount > 0 && (
                  <div className={`mt-3 p-3 rounded-lg ${
                    change >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <div className="flex justify-between">
                      <span className="font-medium">Kembalian</span>
                      <span className={`text-lg font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatRupiah(Math.abs(change))}{change < 0 && ' (Kurang)'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsPaymentOpen(false)} className="flex-1">Batal</Button>
              <Button onClick={handlePayment} disabled={paymentMethod === 'cash' && paidAmount < total} loading={checkoutMutation.isPending} className="flex-1">
                Proses Pembayaran
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReceipt && lastTransaction && (
        <Receipt transaction={lastTransaction} onClose={() => { setShowReceipt(false); setLastTransaction(null); }} />
      )}
    </div>
  );
}