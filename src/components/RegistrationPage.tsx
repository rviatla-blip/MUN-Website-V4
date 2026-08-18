import { useState } from 'react';
import { User, Mail, Phone, School, CheckCircle, AlertCircle, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { committeeNames, countries } from '../lib/data';
import awsmunLogo from '../../public/image.png';

interface FormData {
  name: string;
  email: string;
  school: string;
  phone: string;
  pref1Committee: string;
  pref1Country: string;
  pref2Committee: string;
  pref2Country: string;
  pref3Committee: string;
  pref3Country: string;
}

type Step = 1 | 2 | 3 | 4;

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
    pref1Committee: '',
    pref1Country: '',
    pref2Committee: '',
    pref2Country: '',
    pref3Committee: '',
    pref3Country: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    assignment?: {
      committee: string;
      country: string;
      allocationType: string;
    };
  } | null>(null);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (currentStep: Step): boolean => {
    const newErrors: Partial<FormData> = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    } else if (currentStep === 2) {
      if (!formData.school.trim()) newErrors.school = 'School is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    } else if (currentStep === 3) {
      if (!formData.pref1Committee || !formData.pref1Country) {
        newErrors.pref1Committee = 'First preference is required';
      }
      if (!formData.pref2Committee || !formData.pref2Country) {
        newErrors.pref2Committee = 'Second preference is required';
      }
      if (!formData.pref3Committee || !formData.pref3Country) {
        newErrors.pref3Committee = 'Third preference is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 4) as Step);
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1) as Step);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Insert delegate
      const { data: delegate, error: insertError } = await supabase
        .from('delegates')
        .insert({
          name: formData.name,
          email: formData.email,
          school: formData.school,
          phone: formData.phone,
          preference_1_committee: formData.pref1Committee,
          preference_1_country: formData.pref1Country,
          preference_2_committee: formData.pref2Committee,
          preference_2_country: formData.pref2Country,
          preference_3_committee: formData.pref3Committee,
          preference_3_country: formData.pref3Country,
          registration_status: 'pending',
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

      // Call allocation edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/allocate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ delegateId: delegate.id }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitResult({
          success: true,
          message: 'Registration complete! Your committee and country assignment:',
          assignment: result.assignment,
        });
        setStep(4);
      } else {
        setSubmitResult({
          success: false,
          message: result.error || 'Allocation failed. Please contact support.',
        });
      }
    } catch (error) {
      setSubmitResult({ success: false, message: 'An error occurred. Please try again.' });
    }

    setIsSubmitting(false);
  };

  const stepLabels = ['Personal Info', 'Contact Details', 'Preferences', 'Confirmation'];

  const getAllocationTypeMessage = (type: string) => {
    switch (type) {
      case '1st Preference':
        return 'You received your first choice!';
      case '2nd Preference':
        return 'Your first choice was taken, but you got your second!';
      case '3rd Preference':
        return 'Your first two choices were taken, but you got your third!';
      case 'Random':
        return 'Your preferences were taken. A random available slot was assigned.';
      default:
        return '';
    }
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
            Complete your registration in three simple steps. Your slot will be assigned automatically.
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
                  <div className={`w-8 sm:w-16 lg:w-24 h-1 mx-2 rounded ${
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
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={nextStep} className="btn-primary flex items-center gap-2">
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Contact Details */}
          {step === 2 && (
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-corporate-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-corporate-600" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-corporate-950">Contact Details</h2>
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
                Select your top 3 committee and country preferences. The system will attempt
                to assign you based on availability, starting with your first choice.
              </p>

              <div className="space-y-6">
                {/* Preference 1 */}
                <div className="bg-corporate-50 border border-corporate-200 rounded-lg p-4">
                  <span className="text-xs font-bold text-corporate-700 uppercase tracking-wider">1st Choice (Highest Priority)</span>
                  <div className="grid sm:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-corporate-700 mb-1">Committee</label>
                      <select
                        value={formData.pref1Committee}
                        onChange={e => updateField('pref1Committee', e.target.value)}
                        className="input-field"
                      >
                        <option value="">Select Committee</option>
                        {committeeNames.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-corporate-700 mb-1">Country</label>
                      <select
                        value={formData.pref1Country}
                        onChange={e => updateField('pref1Country', e.target.value)}
                        className="input-field"
                      >
                        <option value="">Select Country</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Preference 2 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">2nd Choice</span>
                  <div className="grid sm:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-corporate-700 mb-1">Committee</label>
                      <select
                        value={formData.pref2Committee}
                        onChange={e => updateField('pref2Committee', e.target.value)}
                        className="input-field"
                      >
                        <option value="">Select Committee</option>
                        {committeeNames.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-corporate-700 mb-1">Country</label>
                      <select
                        value={formData.pref2Country}
                        onChange={e => updateField('pref2Country', e.target.value)}
                        className="input-field"
                      >
                        <option value="">Select Country</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Preference 3 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">3rd Choice</span>
                  <div className="grid sm:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-corporate-700 mb-1">Committee</label>
                      <select
                        value={formData.pref3Committee}
                        onChange={e => updateField('pref3Committee', e.target.value)}
                        className="input-field"
                      >
                        <option value="">Select Committee</option>
                        {committeeNames.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-corporate-700 mb-1">Country</label>
                      <select
                        value={formData.pref3Country}
                        onChange={e => updateField('pref3Country', e.target.value)}
                        className="input-field"
                      >
                        <option value="">Select Country</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {errors.pref1Committee && (
                <p className="text-red-500 text-sm mt-4">Please complete all preferences</p>
              )}

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
                      Processing...
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

          {/* Step 4: Confirmation */}
          {step === 4 && submitResult?.success && (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-corporate-950 mb-4">
                Registration Successful!
              </h2>
              <p className="text-corporate-700 mb-6">{submitResult.message}</p>

              {submitResult.assignment && (
                <>
                  <div className="bg-corporate-950 rounded-xl p-6 mb-4 inline-block">
                    <div className="text-white text-sm font-medium mb-2">YOUR ASSIGNMENT</div>
                    <div className="text-3xl font-serif font-bold text-white mb-1">
                      {submitResult.assignment.country}
                    </div>
                    <div className="text-corporate-200 text-lg">
                      {submitResult.assignment.committee}
                    </div>
                  </div>

                  <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-6 ${
                    submitResult.assignment.allocationType === '1st Preference' ? 'bg-green-100 text-green-700' :
                    submitResult.assignment.allocationType === '2nd Preference' ? 'bg-blue-100 text-blue-700' :
                    submitResult.assignment.allocationType === '3rd Preference' ? 'bg-purple-100 text-purple-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {submitResult.assignment.allocationType}
                  </div>

                  <p className="text-sm text-corporate-500 mb-6">
                    {getAllocationTypeMessage(submitResult.assignment.allocationType)}
                  </p>
                </>
              )}

              <p className="text-sm text-corporate-500 mb-6">
                A confirmation email will be sent to {formData.email}
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
