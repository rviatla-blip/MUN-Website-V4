import { useState } from 'react';
import { Download, Users, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { committees } from '../lib/data';
import type { Committee } from '../lib/supabase';

export function CommitteesPage() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCard = (name: string) => {
    setExpandedCard(expandedCard === name ? null : name);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-corporate-600 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Globe className="w-12 h-12 text-corporate-600 mx-auto mb-4" />
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-corporate-950 mb-4">
            Our Committees
          </h1>
          <p className="text-lg text-corporate-700 max-w-2xl mx-auto">
            Explore our specialized committees. Select your preferences during registration.
          </p>
        </div>
      </section>

      {/* Committee Cards */}
      <section className="py-12 bg-corporate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            {committees.map((committee: Committee) => (
              <div
                key={committee.name}
                className="card bg-white border-l-4 border-l-corporate-600"
              >
                {/* Card Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block bg-corporate-950 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                        {committee.name}
                      </span>
                      <h3 className="font-serif text-xl font-bold text-corporate-950 mb-2">
                        {committee.fullName}
                      </h3>
                    </div>
                    <button
                      onClick={() => toggleCard(committee.name)}
                      className="p-2 hover:bg-corporate-100 rounded-lg transition-colors"
                    >
                      {expandedCard === committee.name ? (
                        <ChevronUp className="w-5 h-5 text-corporate-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-corporate-600" />
                      )}
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-corporate-700 text-sm leading-relaxed mb-4">
                    {committee.description}
                  </p>

                  {/* Executive Board Preview */}
                  <div className="flex items-center gap-2 text-sm text-corporate-500">
                    <Users className="w-4 h-4" />
                    <span>{committee.executiveBoard.length} Executive Board Members</span>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedCard === committee.name && (
                  <div className="border-t border-corporate-100 bg-corporate-50/50 p-6">
                    <h4 className="font-semibold text-corporate-950 mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-corporate-600" />
                      Executive Board
                    </h4>
                    <div className="space-y-3 mb-6">
                      {committee.executiveBoard.map((member, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                          <span className="font-medium text-corporate-950">{member.name}</span>
                          <span className="text-sm text-corporate-600 font-medium">{member.role}</span>
                        </div>
                      ))}
                    </div>

                    {/* Download Study Guide */}
                    <button className="w-full flex items-center justify-center gap-2 bg-corporate-950 text-white py-3 rounded-lg hover:bg-corporate-600 transition-colors font-medium">
                      <Download className="w-4 h-4" />
                      Download Study Guide
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Selection Guide */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-2xl font-bold text-corporate-950 mb-4">
            How to Choose Your Committee
          </h2>
          <p className="text-corporate-700 mb-8">
            Consider your interests in current affairs, public speaking style, and desired
            experience level when selecting your preferences.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 border border-corporate-200 rounded-xl">
              <div className="w-12 h-12 bg-corporate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-corporate-700">1</span>
              </div>
              <h4 className="font-semibold text-corporate-950 mb-2">Review Committees</h4>
              <p className="text-sm text-corporate-600">Explore each committee to find ones that match your interests.</p>
            </div>
            <div className="p-6 border border-corporate-200 rounded-xl">
              <div className="w-12 h-12 bg-corporate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-corporate-700">2</span>
              </div>
              <h4 className="font-semibold text-corporate-950 mb-2">Pick Your Top 3</h4>
              <p className="text-sm text-corporate-600">Rank your preferences in the registration form.</p>
            </div>
            <div className="p-6 border border-corporate-200 rounded-xl">
              <div className="w-12 h-12 bg-corporate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-corporate-700">3</span>
              </div>
              <h4 className="font-semibold text-corporate-950 mb-2">Submit & Pay</h4>
              <p className="text-sm text-corporate-600">Complete your registration with payment and await your assignment.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
