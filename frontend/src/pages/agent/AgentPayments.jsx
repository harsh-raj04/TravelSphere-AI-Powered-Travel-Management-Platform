import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Building2,
  Smartphone,
  Star,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Wallet,
  TrendingUp,
  ChevronRight,
  Copy,
} from 'lucide-react';
import { agentAPI } from '../../services/api';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

// ─── Formatters ────────────────────────────────────────────────────────────────
const formatINR = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ─── Transaction status badge ──────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    completed: { label: 'Completed', icon: CheckCircle2, cls: 'bg-green-100 text-green-700' },
    pending:   { label: 'Pending',   icon: Clock,        cls: 'bg-yellow-100 text-yellow-700' },
    failed:    { label: 'Failed',    icon: XCircle,      cls: 'bg-red-100 text-red-700' },
  };
  const cfg = map[status] || map.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function EmptyTransactions() {
  return (
    <tr>
      <td colSpan={4} className="px-6 py-12 text-center">
        <IndianRupee className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p className="font-medium text-gray-500">No transactions yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Completed bookings and payouts will appear here.
        </p>
      </td>
    </tr>
  );
}

// ─── Method type meta ─────────────────────────────────────────────────────────
function getMethodMeta(method) {
  if (method.type === 'bank_account') {
    return {
      Icon: Building2,
      label: method.bankName ? `${method.bankName} Bank` : 'Bank Account',
      detail: method.accountNumber ? `•••• ${method.accountNumber}` : 'Bank Account',
      subDetail: method.accountHolderName,
    };
  }
  if (method.type === 'upi') {
    return {
      Icon: Smartphone,
      label: 'UPI',
      detail: method.upiId || 'UPI Account',
      subDetail: null,
    };
  }
  // card
  return {
    Icon: CreditCard,
    label: 'Card',
    detail: method.cardLastFour ? `•••• •••• •••• ${method.cardLastFour}` : 'Card',
    subDetail: method.cardHolderName,
  };
}

// ─── Delete confirmation dialog ────────────────────────────────────────────────
function DeleteConfirmModal({ isOpen, onClose, onConfirm, loading }) {
  return (
    <Modal isOpen={isOpen} title="Remove Payment Method" onClose={onClose} size="sm">
      <div className="text-center">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-gray-700 text-sm leading-relaxed mb-6">
          Are you sure you want to remove this payment method? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Remove
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Payment method card ───────────────────────────────────────────────────────
function PaymentMethodCard({ method, onSetDefault, onDelete, actionLoading }) {
  const { Icon, label, detail, subDetail } = getMethodMeta(method);

  return (
    <div
      className={`flex items-center gap-4 p-4 border rounded-xl bg-white transition-all ${
        method.isDefault
          ? 'border-teal-400 shadow-sm shadow-teal-100'
          : 'border-gray-200 hover:border-teal-200 hover:shadow-sm'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          method.isDefault ? 'bg-teal-50' : 'bg-gray-100'
        }`}
      >
        <Icon className={`w-5 h-5 ${method.isDefault ? 'text-teal-600' : 'text-gray-600'}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {method.isDefault && (
            <span className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-600 border border-teal-200 px-2 py-0.5 rounded-full font-medium">
              <Star className="w-3 h-3 fill-teal-500" />
              Default
            </span>
          )}
          {method.isVerified && (
            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full font-medium">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{detail}</p>
        {subDetail && <p className="text-xs text-gray-400 truncate">{subDetail}</p>}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {!method.isDefault && (
          <button
            onClick={() => onSetDefault(method.id)}
            disabled={actionLoading === method.id}
            className="text-xs text-teal-600 border border-teal-300 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors font-medium disabled:opacity-50"
          >
            {actionLoading === method.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              'Set Default'
            )}
          </button>
        )}
        <button
          onClick={() => onDelete(method.id)}
          disabled={actionLoading === method.id}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          aria-label="Delete payment method"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Add Payment Method Modal ─────────────────────────────────────────────────

const TABS = [
  { id: 'bank_account', label: 'Bank Account', icon: Building2 },
  { id: 'upi',          label: 'UPI',          icon: Smartphone },
  { id: 'card',         label: 'Card',         icon: CreditCard },
];

const EMPTY_FORM = {
  // bank
  accountHolderName: '',
  accountNumber: '',
  ifscCode: '',
  bankName: '',
  // upi
  upiId: '',
  // card
  cardHolderName: '',
  cardNumber: '',
  expiryDate: '',
  // common
  isDefault: false,
};

function AddPaymentMethodModal({ isOpen, onClose, onAdded }) {
  const [activeTab, setActiveTab] = useState('bank_account');
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const addToast = useToast();

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('bank_account');
      setForm(EMPTY_FORM);
      setErrors({});
    }
  }, [isOpen]);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};

    if (activeTab === 'bank_account') {
      if (!form.accountHolderName.trim()) errs.accountHolderName = 'Account holder name is required';
      if (!form.accountNumber.trim()) errs.accountNumber = 'Account number is required';
      else if (!/^\d+$/.test(form.accountNumber.trim())) errs.accountNumber = 'Account number must contain only digits';
      else if (form.accountNumber.trim().length < 4) errs.accountNumber = 'Account number must be at least 4 digits';
      if (!form.ifscCode.trim()) errs.ifscCode = 'IFSC code is required';
      else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode.trim().toUpperCase())) {
        errs.ifscCode = 'Invalid IFSC code (e.g. HDFC0001234)';
      }
      if (!form.bankName.trim()) errs.bankName = 'Bank name is required';
    }

    if (activeTab === 'upi') {
      if (!form.upiId.trim()) errs.upiId = 'UPI ID is required';
      else if (!/^[\w.\-_]+@[\w.\-_]+$/.test(form.upiId.trim())) {
        errs.upiId = 'Invalid UPI ID format (e.g. name@upi)';
      }
    }

    if (activeTab === 'card') {
      if (!form.cardHolderName.trim()) errs.cardHolderName = 'Card holder name is required';
      if (!form.cardNumber.trim()) errs.cardNumber = 'Card number is required';
      else if (!/^\d{16}$/.test(form.cardNumber.replace(/\s/g, ''))) {
        errs.cardNumber = 'Card number must be exactly 16 digits';
      }
      if (!form.expiryDate.trim()) errs.expiryDate = 'Expiry date is required';
      else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiryDate.trim())) {
        errs.expiryDate = 'Expiry must be in MM/YY format';
      }
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const payload = { type: activeTab, isDefault: form.isDefault };

      if (activeTab === 'bank_account') {
        payload.accountHolderName = form.accountHolderName.trim();
        payload.accountNumber = form.accountNumber.trim();
        payload.ifscCode = form.ifscCode.trim().toUpperCase();
        payload.bankName = form.bankName.trim();
      } else if (activeTab === 'upi') {
        payload.upiId = form.upiId.trim();
      } else {
        payload.cardHolderName = form.cardHolderName.trim();
        payload.cardNumber = form.cardNumber.replace(/\s/g, '');
        payload.expiryDate = form.expiryDate.trim();
      }

      await agentAPI.addPaymentMethod(payload);
      addToast('Payment method added successfully', 'success');
      onAdded();
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Failed to add payment method';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} title="Add Payment Method" onClose={onClose} size="md">
      {/* Type tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setActiveTab(tab.id); setErrors({}); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-teal-700 shadow-sm border border-teal-100'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ── Bank Account fields ── */}
        {activeTab === 'bank_account' && (
          <>
            <FormField
              label="Account Holder Name"
              error={errors.accountHolderName}
            >
              <input
                type="text"
                value={form.accountHolderName}
                onChange={(e) => set('accountHolderName', e.target.value)}
                placeholder="As printed on the passbook"
                className={fieldClass(errors.accountHolderName)}
              />
            </FormField>

            <FormField label="Account Number" error={errors.accountNumber}>
              <input
                type="text"
                inputMode="numeric"
                value={form.accountNumber}
                onChange={(e) => set('accountNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="Full account number"
                className={fieldClass(errors.accountNumber)}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="IFSC Code" error={errors.ifscCode}>
                <input
                  type="text"
                  value={form.ifscCode}
                  onChange={(e) => set('ifscCode', e.target.value.toUpperCase())}
                  placeholder="HDFC0001234"
                  maxLength={11}
                  className={fieldClass(errors.ifscCode)}
                />
              </FormField>
              <FormField label="Bank Name" error={errors.bankName}>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={(e) => set('bankName', e.target.value)}
                  placeholder="e.g. HDFC Bank"
                  className={fieldClass(errors.bankName)}
                />
              </FormField>
            </div>
          </>
        )}

        {/* ── UPI fields ── */}
        {activeTab === 'upi' && (
          <FormField label="UPI ID" error={errors.upiId}>
            <input
              type="text"
              value={form.upiId}
              onChange={(e) => set('upiId', e.target.value.trim())}
              placeholder="yourname@upi"
              className={fieldClass(errors.upiId)}
            />
          </FormField>
        )}

        {/* ── Card fields ── */}
        {activeTab === 'card' && (
          <>
            <FormField label="Card Holder Name" error={errors.cardHolderName}>
              <input
                type="text"
                value={form.cardHolderName}
                onChange={(e) => set('cardHolderName', e.target.value)}
                placeholder="Name on card"
                className={fieldClass(errors.cardHolderName)}
              />
            </FormField>

            <FormField label="Card Number" error={errors.cardNumber}>
              <input
                type="text"
                inputMode="numeric"
                value={form.cardNumber}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                  const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
                  set('cardNumber', formatted);
                }}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                className={fieldClass(errors.cardNumber)}
              />
            </FormField>

            <FormField label="Expiry (MM/YY)" error={errors.expiryDate}>
              <input
                type="text"
                inputMode="numeric"
                value={form.expiryDate}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  if (val.length >= 3) val = `${val.slice(0, 2)}/${val.slice(2)}`;
                  set('expiryDate', val);
                }}
                placeholder="MM/YY"
                maxLength={5}
                className={`${fieldClass(errors.expiryDate)} max-w-[140px]`}
              />
            </FormField>
          </>
        )}

        {/* ── Set as default checkbox ── */}
        <label className="flex items-center gap-3 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => set('isDefault', e.target.checked)}
            className="w-4 h-4 accent-teal-600 rounded"
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">
            Set as default payment method
          </span>
        </label>

        {/* ── Submit ── */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Saving...' : 'Add Method'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Shared form field wrapper ─────────────────────────────────────────────────
function FormField({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function fieldClass(hasError) {
  return `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${
    hasError
      ? 'border-red-400 focus:ring-red-200'
      : 'border-gray-300 focus:ring-teal-200 focus:border-teal-400'
  }`;
}

// ─── Empty payment methods state ──────────────────────────────────────────────
function EmptyMethods({ onAdd }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-teal-50 border-2 border-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <CreditCard className="w-8 h-8 text-teal-400" />
      </div>
      <p className="font-semibold text-gray-700 mb-1">No payment methods yet</p>
      <p className="text-sm text-gray-500 mb-5">
        Add a bank account, UPI ID, or card to receive payouts.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Payment Method
      </button>
    </div>
  );
}

// ─── Wallet card ───────────────────────────────────────────────────────────────
function WalletCard({ balance, totalEarned, pendingPayout, onWithdraw }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 p-6 text-white shadow-lg">
      {/* Background decoration */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -right-4 w-56 h-56 rounded-full bg-white/5" />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Balance */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-teal-200" />
            <p className="text-sm font-medium text-teal-100">Available Balance</p>
          </div>
          <p className="text-4xl font-bold tracking-tight">{formatINR(balance)}</p>
          <p className="text-xs text-teal-200 mt-1">Ready to withdraw to your linked account</p>
        </div>

        {/* Stats */}
        <div className="flex gap-6 sm:gap-8">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center mb-0.5">
              <TrendingUp className="w-3.5 h-3.5 text-teal-200" />
              <p className="text-xs text-teal-200 font-medium">Total Earned</p>
            </div>
            <p className="text-lg font-bold">{formatINR(totalEarned)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center mb-0.5">
              <Clock className="w-3.5 h-3.5 text-teal-200" />
              <p className="text-xs text-teal-200 font-medium">Pending</p>
            </div>
            <p className="text-lg font-bold">{formatINR(pendingPayout)}</p>
          </div>
        </div>

        {/* Withdraw button */}
        <button
          onClick={onWithdraw}
          disabled={balance <= 0}
          className="flex items-center gap-2 px-5 py-3 bg-white text-teal-700 rounded-xl font-semibold text-sm hover:bg-teal-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
        >
          <ArrowDownLeft className="w-4 h-4" />
          Withdraw Funds
        </button>
      </div>
    </div>
  );
}

// ─── Withdraw modal ────────────────────────────────────────────────────────────
function WithdrawModal({ isOpen, onClose, balance, methods, onSuccess }) {
  const addToast = useToast();
  const [step, setStep] = useState('pick'); // 'pick' | 'success'
  const [selectedId, setSelectedId] = useState(null);
  const [amount, setAmount] = useState('');
  const [amountErr, setAmountErr] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successData, setSuccessData] = useState(null); // withdrawal record from server
  const [copied, setCopied] = useState(false);

  // Only reset on open→close→open transitions, not when balance/methods
  // change mid-session (e.g. after a successful withdrawal updates the parent).
  const wasOpenRef = useRef(false);
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (isOpen && !wasOpen) {
      setStep('pick');
      setSelectedId(methods.find((m) => m.isDefault)?.id || methods[0]?.id || null);
      setAmount(balance > 0 ? String(Math.floor(balance)) : '');
      setAmountErr('');
      setProcessing(false);
      setSuccessData(null);
      setCopied(false);
    }
  }, [isOpen, balance, methods]);

  const handleProceed = async () => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num < 1000) {
      setAmountErr('Minimum withdrawal amount is ₹1,000');
      return;
    }
    if (num > balance) {
      setAmountErr(`Cannot exceed available balance of ${formatINR(balance)}`);
      return;
    }
    if (!selectedId) {
      addToast('Please select a payment method', 'warning');
      return;
    }
    setAmountErr('');
    setProcessing(true);
    try {
      const res = await agentAPI.createWithdrawal(num, selectedId);
      const withdrawal = res.data?.data?.withdrawal;
      setSuccessData(withdrawal);
      setStep('success');
      onSuccess(withdrawal);
    } catch (err) {
      const msg = err.response?.data?.message || 'Withdrawal failed. Please try again.';
      addToast(msg, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!successData?.transactionId) return;
    navigator.clipboard.writeText(successData.transactionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedMethod = methods.find((m) => m.id === selectedId);
  const { label: methodLabel, detail: methodDetail } = selectedMethod
    ? getMethodMeta(selectedMethod)
    : successData?.methodSnapshot
    ? { label: successData.methodSnapshot.label, detail: successData.methodSnapshot.detail }
    : { label: '', detail: '' };

  return (
    <Modal isOpen={isOpen} title={step === 'success' ? 'Withdrawal Successful' : 'Withdraw Funds'} onClose={onClose} size="sm">
      {step === 'pick' ? (
        <div className="space-y-5">
          {/* Balance chip */}
          <div className="flex items-center justify-between bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
            <span className="text-sm text-teal-700 font-medium">Available Balance</span>
            <span className="text-lg font-bold text-teal-700">{formatINR(balance)}</span>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              Withdrawal Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₹</span>
              <input
                type="number"
                min="1"
                max={balance}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setAmountErr(''); }}
                placeholder="Enter amount"
                className={`w-full pl-7 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${
                  amountErr ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-teal-200 focus:border-teal-400'
                }`}
              />
            </div>
            {amountErr && <p className="text-red-500 text-xs mt-1">{amountErr}</p>}
            <button
              onClick={() => { setAmount(String(Math.floor(balance))); setAmountErr(''); }}
              className="text-xs text-teal-600 font-semibold mt-1.5 hover:text-teal-700"
            >
              Withdraw full balance
            </button>
          </div>

          {/* Method picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Withdraw To
            </label>
            {methods.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                No payment methods saved. Add one below before withdrawing.
              </p>
            ) : (
              <div className="space-y-2">
                {methods.map((m) => {
                  const { Icon, label, detail } = getMethodMeta(m);
                  const active = selectedId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedId(m.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        active
                          ? 'border-teal-500 bg-teal-50 shadow-sm'
                          : 'border-gray-200 hover:border-teal-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? 'bg-teal-100' : 'bg-gray-100'}`}>
                        <Icon className={`w-4 h-4 ${active ? 'text-teal-600' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${active ? 'text-teal-700' : 'text-gray-800'}`}>{label}</p>
                        <p className="text-xs text-gray-500 truncate">{detail}</p>
                      </div>
                      {m.isDefault && (
                        <span className="text-[10px] bg-teal-100 text-teal-600 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                          Default
                        </span>
                      )}
                      {active && <ChevronRight className="w-4 h-4 text-teal-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleProceed}
              disabled={processing || methods.length === 0}
              className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
              ) : (
                <><ArrowDownLeft className="w-4 h-4" /> Withdraw</>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* ── Success card ── */
        <div className="text-center space-y-5">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {formatINR(successData?.amount ?? parseFloat(amount))}
            </h3>
            <p className="text-sm text-gray-500 mt-1">Withdrawal request submitted</p>
          </div>

          {/* Details card */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Transaction ID</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-semibold text-gray-800">
                  {successData?.transactionId}
                </span>
                <button onClick={handleCopy} className="text-gray-400 hover:text-teal-600 transition-colors">
                  {copied
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                    : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Transferred To</span>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-800">{methodLabel}</p>
                <p className="text-xs text-gray-500">{methodDetail}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Expected By</span>
              <span className="text-xs font-semibold text-gray-800">
                {successData?.expectedAt
                  ? new Date(successData.expectedAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })
                  : '5 business days'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Status</span>
              <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                <Clock className="w-3 h-3" /> Pending
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            A confirmation will be sent to your registered email once the transfer is complete.
          </p>

          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}

// ─── AgentPayments (main page) ────────────────────────────────────────────────
export function AgentPayments() {
  const addToast = useToast();

  // ── Earnings / balance state ─────────────────────────────────────────────────
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // ── Withdrawal history ───────────────────────────────────────────────────────
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // ── Payment methods ──────────────────────────────────────────────────────────
  const [methods, setMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // ── Modals ───────────────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Fetch earnings summary ───────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      const res = await agentAPI.getEarningsSummary();
      setSummary(res.data?.data || null);
    } catch {
      addToast('Failed to load earnings data', 'error');
    } finally {
      setLoadingSummary(false);
    }
  }, [addToast]);

  // ── Fetch withdrawal history ─────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await agentAPI.getWithdrawalHistory();
      setWithdrawals(res.data?.data?.withdrawals || []);
    } catch {
      // history is non-critical, silently ignore
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // ── Fetch payment methods ────────────────────────────────────────────────────
  const fetchMethods = useCallback(async () => {
    try {
      setLoadingMethods(true);
      const res = await agentAPI.getPaymentMethods();
      setMethods(res.data?.data?.methods || []);
    } catch {
      addToast('Failed to load payment methods', 'error');
    } finally {
      setLoadingMethods(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchSummary();
    fetchHistory();
    fetchMethods();
  }, [fetchSummary, fetchHistory, fetchMethods]);

  // ── Set default method ───────────────────────────────────────────────────────
  const handleSetDefault = async (id) => {
    setActionLoading(id);
    try {
      await agentAPI.updatePaymentMethod(id, { isDefault: true });
      addToast('Default payment method updated', 'success');
      await fetchMethods();
    } catch {
      addToast('Failed to update default method', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Delete method ────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await agentAPI.deletePaymentMethod(deleteTarget);
      addToast('Payment method removed', 'success');
      setDeleteTarget(null);
      await fetchMethods();
    } catch {
      addToast('Failed to remove payment method', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── After successful withdrawal: optimistic update + re-fetch ─────────────────
  const handleWithdrawSuccess = useCallback((newWithdrawal) => {
    setSummary((prev) =>
      prev
        ? {
            ...prev,
            availableBalance: Math.max(0, prev.availableBalance - newWithdrawal.amount),
            totalPending: prev.totalPending + newWithdrawal.amount,
          }
        : prev
    );
    setWithdrawals((prev) => [newWithdrawal, ...prev]);
  }, []);

  const balance = summary?.availableBalance ?? 0;
  const totalEarned = summary?.totalEarned ?? 0;
  const pendingPayout = (summary?.totalPending ?? 0) + (summary?.totalProcessing ?? 0);

  return (
    <div className="p-8 space-y-8 min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Page title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1">Manage your wallet, payouts, and payment methods</p>
      </div>

      {/* ── Wallet card ── */}
      {loadingSummary ? (
        <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 p-6 animate-pulse h-32" />
      ) : (
        <WalletCard
          balance={balance}
          totalEarned={totalEarned}
          pendingPayout={pendingPayout}
          onWithdraw={() => setShowWithdrawModal(true)}
        />
      )}

      {/* ── Withdrawal History Table ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Withdrawal History</h2>
            <p className="text-sm text-gray-500">All withdrawal requests and their status</p>
          </div>
          {withdrawals.length > 0 && (
            <span className="text-xs text-gray-400 font-medium">{withdrawals.length} records</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingHistory ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-300" />
                  </td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <EmptyTransactions />
              ) : (
                withdrawals.map((w) => {
                  const snap = w.methodSnapshot || {};
                  return (
                    <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(w.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-mono text-gray-700">{w.transactionId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{snap.label || 'Payment Method'}</p>
                        <p className="text-xs text-gray-500">{snap.detail || ''}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-red-600">
                          -{formatINR(w.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={w.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Payment Methods ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Payment Methods</h2>
            <p className="text-sm text-gray-500">Saved accounts for withdrawals</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 border-2 border-teal-500 text-teal-600 rounded-xl text-sm font-semibold hover:bg-teal-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>

        {loadingMethods ? (
          <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading payment methods...</span>
          </div>
        ) : methods.length === 0 ? (
          <EmptyMethods onAdd={() => setShowAddModal(true)} />
        ) : (
          <div className="space-y-3">
            {methods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                onSetDefault={handleSetDefault}
                onDelete={(id) => setDeleteTarget(id)}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Withdraw Modal ── */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        balance={balance}
        methods={methods}
        onSuccess={handleWithdrawSuccess}
      />

      {/* ── Add Payment Method Modal ── */}
      <AddPaymentMethodModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={fetchMethods}
      />

      {/* ── Delete Confirm Modal ── */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
  );
}
