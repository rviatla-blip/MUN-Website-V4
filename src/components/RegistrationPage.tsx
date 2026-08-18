import { useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  User, Mail, Phone, School, CheckCircle, AlertCircle, ChevronRight, ChevronLeft,
  Loader2, Upload, CreditCard, Briefcase, Building2, Globe,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  committeeNames, isPersonalityCommittee, getOptionsForCommittee,
} from '../lib/data';
import awsmunLogo from '../../public/image.png';

// --- Config ---
// Replace this with the actual UPI ID for AWSMUN payments
const UPI_ID = 'awsmun@ambitus';
const PAYEE_NAME = 'AWSMUN';
const REGISTRATION_FEE = 'Rs. 1,500';

interface FormData {
  name: string;
  email: string;
  school: string;
  phone: string;
  isAmbitusStudent: boolean;
  experience: string;
  pref1Committee: string;
  pref1Country: string;
  pref1Custom: string;
  pref2Committee: string;
  pref2Country: string;
  pref2Custom: string;
  pref3Committee: string;
  pref3Country: string;
  pref3Custom: string;
  paymentProofFile: File | null;
}

type Step = 1 | 2 | 3 | 4 | 5;

interface RegistrationPageProps {
  onComplete: () => void;
}

export function RegistrationPage({ onComplete }: RegistrationPageProps) {
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    school: '',
    phone: '',
    isAmbitusStudent: false,
    experience: '',
    pref1Committee: '',
    pref1Country: '',
    pref1Custom: '',
    pref2Committee: '',
    pref2Country: '',
    pref2Custom: '',
    pref3Committee: '',
    pref3Country: '',
    pref3Custom: '',
    paymentProofFile: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate UPI QR code on mount and when entering payment step
  const generateQR = async () => {
    const upiString = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=1500&cu=INR&tn=AWSMUN%20Registration`;
    try {
      const url = await QRCode.toDataURL(upiString, {
        width: 280,
        margin: 2,
        color: { dark: '#00343C', light: '#ffffff' },
      });
      setQrCodeUrl(url);
    } catch {
      // ignore QR generation errors
    }
  };

  const updateField = (field: keyof FormData, value: string | boolean | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const errKey = field as string;
    if (errors[errKey]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[errKey];
        return next;
      });
    }
  };

  // --- Validation ---
  const validateStep = (currentStep: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    } else if (currentStep === 2) {
      if (!formData.school.trim()) newErrors.school = 'School is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
      if (!formData.experience.trim()) newErrors.experience = 'Please describe your experience';
    } else if (currentStep === 3) {
      // Validate each preference
      const prefs = [
        { committee: formData.pref1Committee, country: formData.pref1Country, custom: formData.pref1Custom, label: '1st' },
        { committee: formData.pref2Committee, country: formData.pref2Country, custom: formData.pref2Custom, label: '2nd' },
        { committee: formData.pref3Committee, country: formData.pref3Country, custom: formData.pref3Custom, label: '3rd' },
      ];

      const prefNumMap: Record<string, number> = { '1st': 1, '2nd': 2, '3rd': 3 };

      prefs.forEach((pref) => {
        const num = prefNumMap[pref.label];
        if (!pref.committee) {
          newErrors[`pref${num}Committee`] = `${pref.label} preference committee is required`;
        }
        const countryVal = pref.country === '__custom__' ? pref.custom.trim() : pref.country;
        if (!countryVal) {
          newErrors[`pref${num}Country`] = `${pref.label} preference country/personality is required`;
        }
      });

      // Check no repeated committees (each committee only once)
      const seenCommittees: string[] = [];
      prefs.forEach((pref) => {
        const num = prefNumMap[pref.label];
        if (pref.committee) {
          if (seenCommittees.includes(pref.committee)) {
            newErrors[`pref${num}Committee`] = 'This committee is already selected in another preference. Please choose a different committee.';
          } else {
            seenCommittees.push(pref.committee);
          }
        }
      });

      // Check no repeated committee+country combos
      const combos: string[] = [];
      prefs.forEach((pref) => {
        const num = prefNumMap[pref.label];
        const countryVal = pref.country === '__custom__' ? pref.custom.trim() : pref.country;
        if (pref.committee && countryVal) {
          const combo = `${pref.committee}|||${countryVal.toLowerCase()}`;
          if (combos.includes(combo)) {
            newErrors[`pref${num}Country`] = 'This committee and country/personality combination is already selected. Please choose a different one.';
          } else {
            combos.push(combo);
          }
        }
      });
    } else if (currentStep === 4) {
      if (!formData.paymentProofFile) {
        newErrors.paymentProofFile = 'Please upload your payment proof';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      if (step === 3) {
        generateQR();
      }
      setStep(prev => Math.min(prev + 1, 5) as Step);
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1) as Step);
  };

  // --- File upload ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, paymentProofFile: 'File must be under 5MB' }));
      return;
    }
    updateField('paymentProofFile', file);
    setUploadPreview(URL.createObjectURL(file));
    setErrors(prev => {
      const next = { ...prev };
      delete next.paymentProofFile;
      return next;
    });
  };

  // --- Submit ---
  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // 1. Upload payment proof to storage
      let paymentProofUrl: string | null = null;
      if (formData.paymentProofFile) {
        const fileExt = formData.paymentProofFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, formData.paymentProofFile);

        if (uploadError) {
          setSubmitResult({ success: false, message: 'Failed to upload payment proof. Please try again.' });
          setIsSubmitting(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(fileName);
        paymentProofUrl = publicUrlData.publicUrl;
      }

      // 2. Resolve country/personality values (custom or selected)
      const resolveCountry = (country: string, custom: string) =>
        country === '__custom__' ? custom.trim() : country;

      const pref1Country = resolveCountry(formData.pref1Country, formData.pref1Custom);
      const pref2Country = resolveCountry(formData.pref2Country, formData.pref2Custom);
      const pref3Country = resolveCountry(formData.pref3Country, formData.pref3Custom);

      // 3. Insert delegate (no auto-allocation)
      const { data: delegate, error: insertError } = await supabase
        .from('delegates')
        .insert({
          name: formData.name,
          email: formData.email,
          school: formData.school,
          phone: formData.phone,
          experience: formData.experience,
          is_ambitus_student: formData.isAmbitusStudent,
          preference_1_committee: formData.pref1Committee,
          preference_1_country: pref1Country,
          preference_2_committee: formData.pref2Committee,
          preference_2_country: pref2Country,
          preference_3_committee: formData.pref3Committee,
          preference_3_country: pref3Country,
          registration_status: 'pending',
          payment_status: 'submitted',
          payment_proof_url: paymentProofUrl,
        })
        .select()
        .maybeSingle();

      if (insertError) {
        if (insertError.code === '23505') {
          setSubmitResult({ success: false, message: 'This email is already registered.' });
        } else {
          setSubmitResult({ success: false, message: 'Registration failed. Please try again.' });
        }
        setIsSubmitting(false);
        return;
      }

      // 4. Sync to Google Sheets (fire and forget — don't block on it)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      try {
        await fetch(`${supabaseUrl}/functions/v1/sync-to-sheets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ delegateId: delegate.id }),
        });
      } catch {
        // Sheet sync is best-effort; don't fail the registration
      }

      setSubmitResult({
        success: true,
        message: 'Registration submitted successfully! Your preferences and payment proof have been recorded. You will receive your committee and country assignment after verification.',
      });
      setStep(5);
    } catch {
      setSubmitResult({ success: false, message: 'An error occurred. Please try again.' });
    }

    setIsSubmitting(false);
  };

  const stepLabels = ['Personal Info', 'School & Experience', 'Preferences', 'Payment', 'Confirmation'];

  // --- Preference field component ---
  const PreferenceBlock = ({
    prefNum, label, bgColor, borderColor, badgeColor,
  }: {
    prefNum: 1 | 2 | 3; label: string; bgColor: string; borderColor: string; badgeColor: string;
  }) => {
    const committeeKey = `pref${prefNum}Committee` as keyof FormData;
    const countryKey = `pref${prefNum}Country` as keyof FormData;
    const customKey = `pref${prefNum}Custom` as keyof FormData;

    const committee = formData[committeeKey] as string;
    const country = formData[countryKey] as string;
    const custom = formData[customKey] as string;

    const options = committee ? getOptionsForCommittee(committee) : [];
    const isPersonality = committee ? isPersonalityCommittee(committee) : false;

    // Committees already selected in other preference slots
    const allCommittees = [formData.pref1Committee, formData.pref2Committee, formData.pref3Committee];
    const usedCommittees = allCommittees.filter((c, i) => c !== '' && i !== prefNum - 1);

    return (
      <div className={`${bgColor} border ${borderColor} rounded-lg p-4`}>
        <span className={`text-xs font-bold uppercase tracking-wider ${badgeColor}`}>{label}</span>
        <div className="grid sm:grid-cols-2 gap-4 mt-3">
          <div>
            <label className="block text-sm font-medium text-corporate-700 mb-1">Committee</label>
            <select
              value={committee}
              onChange={e => {
                updateField(committeeKey, e.target.value);
                updateField(countryKey, '');
                updateField(customKey, '');
              }}
              className="input-field"
            >
              <option value="">Select Committee</option>
              {committeeNames.map(c => (
                <option key={c} value={c} disabled={usedCommittees.includes(c)}>
                  {c}{usedCommittees.includes(c) ? ' (already selected)' : ''}
                </option>
              ))}
            </select>
            {errors[`${committeeKey}`] && <p className="text-red-500 text-sm mt-1">{errors[`${committeeKey}`]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-corporate-700 mb-1">
              {isPersonality ? 'Personality' : 'Country / Personality'}
            </label>
            <select
              value={country}
              onChange={e => {
                updateField(countryKey, e.target.value);
                if (e.target.value !== '__custom__') updateField(customKey, '');
              }}
              className="input-field"
              disabled={!committee}
            >
              <option value="">{committee ? `Select ${isPersonality ? 'Personality' : 'Country'}` : 'Select committee first'}</option>
              {options.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__custom__">Other (type your own)</option>
            </select>
            {errors[`${countryKey}`] && <p className="text-red-500 text-sm mt-1">{errors[`${countryKey}`]}</p>}
          </div>
        </div>
        {country === '__custom__' && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-corporate-700 mb-1">
              {isPersonality ? 'Enter Personality Name' : 'Enter Country / Personality Name'}
            </label>
            <input
              type="text"
              value={custom}
              onChange={e => updateField(customKey, e.target.value)}
              className={`input-field ${errors[`${countryKey}`] && !custom.trim() ? 'border-red-500' : ''}`}
              placeholder={isPersonality ? 'e.g., Amit Shah (BJP)' : 'e.g., South Korea'}
            />
            {errors[`${countryKey}`] && !custom.trim() && <p className="text-red-500 text-sm mt-1">{errors[`${countryKey}`]}</p>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-white py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-corporate-600 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <img src={awsmunLogo} alt="AWSMUN" className="w-12 h-12 rounded-full object-cover mx-auto mb-4" />
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-corporate-950 mb-4">
            Delegate Registration
          </h1>
          <p className="text-lg text-corporate-700 max-w-2xl mx-auto">
            Complete your registration in four simple steps. Submit your preferences and payment proof.
          </p>
        </div>
      </section>

      {/* Progress Bar */}
      <section className="bg-corporate-50 py-4 border-y border-corporate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {stepLabels.map((label, index) => (
              <div key={label} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                  step > index + 1 ? 'bg-corporate-950 text-white' :
                  step === index + 1 ? 'bg-white text-corporate-950 border-2 border-corporate-950' :
                  'bg-white text-corporate-400 border-2 border-corporate-200'
                }`}>
                  {step > index + 1 ? <CheckCircle className="w-5 h-5" /> : index + 1}
                </div>
                <span className={`ml-2 text-sm font-medium hidden sm:inline ${
                  step >= index + 1 ? 'text-corporate-950' : 'text-corporate-400'
                }`}>
                  {label}
                </span>
                {index < stepLabels.length - 1 && (
                  <div className={`w-8 sm:w-12 lg:w-16 h-1 mx-2 rounded ${
                    step > index + 1 ? 'bg-corporate-950' : 'bg-corporate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Content */}
      <section className="py-12 bg-corporate-50/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {submitResult && !submitResult.success && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700">{submitResult.message}</span>
            </div>
          )}

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-corporate-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-corporate-600" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-corporate-950">Personal Information</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-corporate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => updateField('name', e.target.value)}
                    className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-corporate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => updateField('email', e.target.value)}
                    className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="your@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-corporate-700 mb-2">Are you an Ambitus World School student?</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => updateField('isAmbitusStudent', true)}
                      className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all ${
                        formData.isAmbitusStudent
                          ? 'border-corporate-950 bg-corporate-950 text-white'
                          : 'border-corporate-200 bg-white text-corporate-700 hover:border-corporate-400'
                      }`}
                    >
                      <Building2 className="w-5 h-5 inline mr-2" />
                      Yes, Ambitus Student
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('isAmbitusStudent', false)}
                      className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all ${
                        !formData.isAmbitusStudent
                          ? 'border-corporate-950 bg-corporate-950 text-white'
                          : 'border-corporate-200 bg-white text-corporate-700 hover:border-corporate-400'
                      }`}
                    >
                      <Globe className="w-5 h-5 inline mr-2" />
                      No, External Delegate
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={nextStep} className="btn-primary flex items-center gap-2">
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: School & Experience */}
          {step === 2 && (
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-corporate-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-corporate-600" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-corporate-950">School & Experience</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-corporate-700 mb-1">
                    <School className="w-4 h-4 inline mr-1" />
                    School / Institution
                  </label>
                  <input
                    type="text"
                    value={formData.school}
                    onChange={e => updateField('school', e.target.value)}
                    className={`input-field ${errors.school ? 'border-red-500' : ''}`}
                    placeholder="Your school or institution name"
                  />
                  {errors.school && <p className="text-red-500 text-sm mt-1">{errors.school}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-corporate-700 mb-1">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="+91 98765 43210"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-corporate-700 mb-1">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    MUN / Debate Experience
                  </label>
                  <textarea
                    value={formData.experience}
                    onChange={e => updateField('experience', e.target.value)}
                    className={`input-field ${errors.experience ? 'border-red-500' : ''} min-h-[120px] resize-y`}
                    placeholder="Describe your previous Model UN or debate experience (committees, awards, years of participation, etc.)"
                  />
                  {errors.experience && <p className="text-red-500 text-sm mt-1">{errors.experience}</p>}
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button onClick={prevStep} className="btn-secondary flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={nextStep} className="btn-primary flex items-center gap-2">
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-corporate-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-corporate-600" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-corporate-950">Committee Preferences</h2>
              </div>

              <p className="text-corporate-700 text-sm mb-6">
                Select your top 3 committee and country/personality preferences. For AIPPM, choose from
                Indian political personalities. You can also type your own country or personality by
                selecting "Other." Each preference must be unique — no repeats.
              </p>

              <div className="space-y-6">
                <PreferenceBlock
                  prefNum={1}
                  label="1st Choice (Highest Priority)"
                  bgColor="bg-corporate-50"
                  borderColor="border-corporate-200"
                  badgeColor="text-corporate-700"
                />
                <PreferenceBlock
                  prefNum={2}
                  label="2nd Choice"
                  bgColor="bg-gray-50"
                  borderColor="border-gray-200"
                  badgeColor="text-gray-600"
                />
                <PreferenceBlock
                  prefNum={3}
                  label="3rd Choice"
                  bgColor="bg-gray-50"
                  borderColor="border-gray-200"
                  badgeColor="text-gray-600"
                />
              </div>

              <div className="mt-8 flex justify-between">
                <button onClick={prevStep} className="btn-secondary flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={nextStep} className="btn-primary flex items-center gap-2">
                  Proceed to Payment <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-corporate-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-corporate-600" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-corporate-950">Payment</h2>
              </div>

              <p className="text-corporate-700 text-sm mb-6">
                Scan the QR code below using any UPI app (Google Pay, PhonePe, Paytm, etc.) to pay the
                registration fee of <strong>{REGISTRATION_FEE}</strong>. After payment, upload a
                screenshot of your payment confirmation.
              </p>

              {/* QR Code */}
              <div className="flex flex-col items-center mb-8">
                {qrCodeUrl ? (
                  <div className="bg-white p-4 rounded-xl border-2 border-corporate-200 shadow-md">
                    <img src={qrCodeUrl} alt="UPI Payment QR Code" className="w-56 h-56" />
                  </div>
                ) : (
                  <div className="w-56 h-56 bg-corporate-50 rounded-xl flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-corporate-400 animate-spin" />
                  </div>
                )}
                <div className="mt-4 text-center">
                  <p className="text-sm text-corporate-600">UPI ID: <strong>{UPI_ID}</strong></p>
                  <p className="text-sm text-corporate-600">Amount: <strong>{REGISTRATION_FEE}</strong></p>
                </div>
              </div>

              {/* Upload Payment Proof */}
              <div>
                <label className="block text-sm font-medium text-corporate-700 mb-2">
                  Upload Payment Proof (screenshot)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                    errors.paymentProofFile ? 'border-red-400 bg-red-50' : 'border-corporate-300 hover:border-corporate-500 hover:bg-corporate-50'
                  }`}
                >
                  {uploadPreview ? (
                    <div className="flex flex-col items-center">
                      <img src={uploadPreview} alt="Payment proof preview" className="max-h-48 rounded-lg mb-3" />
                      <p className="text-sm text-corporate-600">Click to change file</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-10 h-10 text-corporate-400 mb-2" />
                      <p className="text-corporate-700 font-medium">Click to upload payment screenshot</p>
                      <p className="text-sm text-corporate-500 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {errors.paymentProofFile && <p className="text-red-500 text-sm mt-2">{errors.paymentProofFile}</p>}
              </div>

              <div className="mt-8 flex justify-between">
                <button onClick={prevStep} className="btn-secondary flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Complete Registration <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && submitResult?.success && (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-corporate-950 mb-4">
                Registration Submitted!
              </h2>
              <p className="text-corporate-700 mb-6">{submitResult.message}</p>

              <div className="bg-corporate-50 border border-corporate-200 rounded-lg p-6 mb-6 text-left">
                <h4 className="font-semibold text-corporate-950 mb-3">Your Preferences:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="bg-corporate-100 text-corporate-700 px-2 py-0.5 rounded font-medium">1st</span>
                    <span className="text-corporate-700">
                      {formData.pref1Committee} - {formData.pref1Country === '__custom__' ? formData.pref1Custom : formData.pref1Country}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">2nd</span>
                    <span className="text-corporate-700">
                      {formData.pref2Committee} - {formData.pref2Country === '__custom__' ? formData.pref2Custom : formData.pref2Country}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">3rd</span>
                    <span className="text-corporate-700">
                      {formData.pref3Committee} - {formData.pref3Country === '__custom__' ? formData.pref3Custom : formData.pref3Country}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-corporate-500 mb-6">
                Your data has been recorded and sent to the AWSMUN team. Committee and country
                assignments will be allocated manually after payment verification.
              </p>

              <button onClick={onComplete} className="btn-primary">
                Return to Home
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
