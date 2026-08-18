import { Calendar, Users, Award, ArrowRight, MapPin, Globe } from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import type { Page } from './Layout';

const HERO_BG = 'https://images.pexels.com/photos/16146279/pexels-photo-16146279.jpeg?auto=compress&cs=tinysrgb&w=1600';

interface HomePageProps {
  onNavigate: (page: Page) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const conferenceDate = new Date('2026-09-12T08:00:00');

  return (
    <div>
      {/* Hero Section with Background Image and Centered Countdown */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_BG}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-corporate-950/75" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-corporate-300" />
            <span className="text-white/90 text-sm font-medium">Ambitus World School Presents</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            Ambitus World School
            <br />
            <span className="text-corporate-300">Model United Nations</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-2 font-medium">
            AWSMUN 2026
          </p>
          <p className="text-base text-corporate-300 max-w-2xl mx-auto mb-6 font-medium tracking-wide">
            Edition IV
          </p>

          <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-10">
            <Calendar className="w-4 h-4 text-corporate-300" />
            <span className="text-white/90 text-sm font-medium">September 12-13, 2026</span>
            <span className="text-white/30">|</span>
            <MapPin className="w-4 h-4 text-corporate-300" />
            <span className="text-white/90 text-sm">Ambitus World School Campus</span>
          </div>

          {/* Countdown Timer — centered as the main element */}
          <div className="mb-10">
            <CountdownTimer targetDate={conferenceDate} />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => onNavigate('register')} className="btn-primary text-lg px-8 py-4">
              Register Now
              <ArrowRight className="inline-block ml-2 w-5 h-5" />
            </button>
            <button onClick={() => onNavigate('committees')} className="btn-secondary text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-corporate-950">
              View Committees
            </button>
          </div>
        </div>
      </section>

      {/* Stats (without delegate count) */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-corporate-100 shadow-sm text-center">
              <Globe className="w-7 h-7 text-corporate-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-corporate-950 mb-0.5">5</div>
              <div className="text-xs text-corporate-500">Committees</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-corporate-100 shadow-sm text-center">
              <MapPin className="w-7 h-7 text-corporate-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-corporate-950 mb-0.5">40+</div>
              <div className="text-xs text-corporate-500">Countries</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-corporate-100 shadow-sm text-center">
              <Calendar className="w-7 h-7 text-corporate-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-corporate-950 mb-0.5">2</div>
              <div className="text-xs text-corporate-500">Days</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-corporate-950 mb-6">
                Empowering Tomorrow's Leaders
              </h2>
              <p className="text-lg text-corporate-700 mb-6 leading-relaxed">
                AWSMUN provides a platform for students to engage with global issues,
                develop diplomatic skills, and build lasting international connections.
                Join us for two days of debate, collaboration, and growth.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-corporate-100 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-corporate-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-corporate-950 mb-1">Expert-Led Sessions</h4>
                    <p className="text-corporate-600 text-sm">
                      Experienced executive boards guide each committee.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-corporate-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-corporate-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-corporate-950 mb-1">Diverse Participation</h4>
                    <p className="text-corporate-600 text-sm">
                      Connect with delegates from schools across the region.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-corporate-100 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-corporate-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-corporate-950 mb-1">Real-World Issues</h4>
                    <p className="text-corporate-600 text-sm">
                      Debate authentic UN agenda items and develop policy solutions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-12 lg:mt-0">
              <div className="bg-corporate-950 rounded-2xl p-8 text-white shadow-2xl">
                <h3 className="font-serif text-2xl font-semibold mb-6 text-white">Conference Highlights</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-corporate-300" />
                    <span>Opening Ceremony with keynote speakers</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-corporate-300" />
                    <span>5 specialized committees</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-corporate-300" />
                    <span>Comprehensive study guides provided</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-corporate-300" />
                    <span>Delegate social and networking events</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-corporate-300" />
                    <span>Awards and certificates</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-corporate-300" />
                    <span>Closing ceremony and recognition</span>
                  </li>
                </ul>
                <button
                  onClick={() => onNavigate('committees')}
                  className="mt-8 w-full bg-white text-corporate-950 font-semibold py-3 rounded-lg hover:bg-corporate-100 transition-colors"
                >
                  Explore Committees
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 bg-corporate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Make Your Voice Heard?
          </h2>
          <p className="text-lg text-corporate-200 mb-8">
            Registration is now open. Submit your preferences and payment today.
          </p>
          <button
            onClick={() => onNavigate('register')}
            className="bg-white text-corporate-950 font-semibold px-8 py-4 rounded-lg hover:bg-corporate-100 transition-colors text-lg shadow-lg"
          >
            Begin Registration
          </button>
        </div>
      </section>
    </div>
  );
}
