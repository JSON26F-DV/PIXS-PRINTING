import React from 'react';
import { FiExternalLink, FiFileText, FiShield, FiRotateCcw } from 'react-icons/fi';

const PoliciesSection: React.FC = () => {
  return (
    <div className="SettingsPolicies space-y-12 pb-20">
      <div className="space-y-1">
        <h1 className="PoliciesTitle text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
          Policies
        </h1>
        <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">
          Legal Framework & Binding Compliance Documentation
        </p>
      </div>

      {/* 1. Terms of Service */}
      <section className="PoliciesTerms space-y-6">
        <header className="flex items-center gap-3 border-b border-slate-900/10 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-pixs-mint shadow-lg">
            <FiFileText size={20} />
          </div>
          <h2 className="PoliciesSectionHeader text-xl font-black tracking-tighter text-slate-900 uppercase italic">
            Terms of Service
          </h2>
        </header>

        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="PoliciesSubHeader text-xs font-black uppercase tracking-widest text-slate-900 italic">
              A. General Agreement & Acceptance
            </h3>
            <p className="PoliciesParagraph text-sm leading-relaxed text-slate-600">
              The following Terms of Service ("Terms") constitute a legally binding agreement between the Customer ("you") and <strong>PIXS Printing Shop</strong> ("we," "us," or "PIXS"). By accessing our platform, placing an order, or confirming a quotation, you acknowledge that you have read, understood, and agreed to be bound by these Terms. Digital acceptance through our platform or official communication channels is considered legally equivalent to a signed physical contract.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="PoliciesSubHeader text-xs font-black uppercase tracking-widest text-slate-900 italic">
              B. Orders & Payment Authority
            </h3>
            <p className="PoliciesParagraph text-sm leading-relaxed text-slate-600">
              Order confirmation is finalized only upon verification of payment. PIXS Printing Shop maintains a strict payment policy to protect production resources:
            </p>
            <ul className="PoliciesList ml-4 list-disc space-y-2 text-sm text-slate-600">
              <li><strong>Standard Orders:</strong> Full payment is required before production commencement unless explicitly stated in a formal quotation.</li>
              <li><strong>Machine Purchases:</strong> There is <strong>STRICTLY NO CASH ON DELIVERY (COD)</strong> for machine sales. A non-refundable 50% downpayment is required before any machine production or release. Any remaining balance must be settled in full before the item is released for delivery or pickup.</li>
              <li><strong>Cancellation:</strong> PIXS reserves the right to cancel or suspend any order that remains unpaid or lacks sufficient downpayment within forty-eight (48) hours of placement.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="PoliciesSubHeader text-xs font-black uppercase tracking-widest text-slate-900 italic">
              C. Industrial Production Standards
            </h3>
            <p className="PoliciesParagraph text-sm leading-relaxed text-slate-600">
              Customers acknowledge that bulk manufacturing and high-volume printing processes involve inherent technical variables. Slight discrepancies in color output (due to CMYK vs. Screen Plate variance), alignment (within 1-2mm tolerance), and ink density are considered normal and within industry standards. Absolute perfection on every single unit within a mass-production batch is not guaranteed and does not constitute a valid claim for total batch rejection.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="PoliciesSubHeader text-xs font-black uppercase tracking-widest text-slate-900 italic">
              D. Intellectual Property Indemnification
            </h3>
            <p className="PoliciesParagraph text-sm leading-relaxed text-slate-600">
              Customers are solely responsible for ensuring they possess the necessary rights and licenses for all logos, designs, and intellectual property submitted for printing. PIXS Printing Shop shall not be held liable for any trademark or copyright infringement disputes arising from customer-provided artwork.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="PoliciesSubHeader text-xs font-black uppercase tracking-widest text-slate-900 italic">
              E. Limitation of Liability
            </h3>
            <p className="PoliciesParagraph text-sm leading-relaxed text-slate-600">
              Under no circumstance shall PIXS Printing Shop's liability exceed the total value of the specific service rendered. PIXS shall NOT be liable for collateral business losses, missed marketing deadlines, or any consequential damages resulting from production delays or material discrepancies.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Privacy Policy */}
      <section className="PoliciesPrivacy space-y-6">
        <header className="flex items-center gap-3 border-b border-slate-900/10 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-pixs-mint shadow-lg">
            <FiShield size={20} />
          </div>
          <h2 className="PoliciesSectionHeader text-xl font-black tracking-tighter text-slate-900 uppercase italic">
            Privacy Policy
          </h2>
        </header>

        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="PoliciesSubHeader text-xs font-black uppercase tracking-widest text-slate-900 italic">
              A. Data Collection Protocol
            </h3>
            <p className="PoliciesParagraph text-sm leading-relaxed text-slate-600">
              In accordance with data protection standards, we collect essential identifiers including full legal name, contact information (mobile/email), precise delivery addresses, and preferred payment methods. This data is collected solely for business fulfillment purposes.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="PoliciesSubHeader text-xs font-black uppercase tracking-widest text-slate-900 italic">
              B. Professional Usage of Information
            </h3>
            <p className="PoliciesParagraph text-sm leading-relaxed text-slate-600">
              Collected data is utilized strictly for order processing, logistics coordination with third-party couriers, and official customer communication regarding production status. PIXS enforces a zero-tolerance policy regarding the sale or unauthorized sharing of customer data to external marketing entities.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="PoliciesSubHeader text-xs font-black uppercase tracking-widest text-slate-900 italic">
              C. Financial Data Security
            </h3>
            <p className="PoliciesParagraph text-sm leading-relaxed text-slate-600">
              PIXS Printing Shop utilizes secured, encrypted third-party payment providers. We do not store sensitive credit card or banking details on our internal servers. All financial transactions are subject to the security protocols of our designated payment gateways.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Return & Refund Policy */}
      <section className="PoliciesReturnRefund space-y-6 rounded-[32px] bg-slate-50 p-8 border border-slate-200">
        <header className="flex items-center gap-3 border-b border-slate-900/10 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-pixs-mint shadow-lg">
            <FiRotateCcw size={20} />
          </div>
          <h2 className="PoliciesSectionHeader text-xl font-black tracking-tighter text-slate-900 uppercase italic">
            Return & Refund Policy
          </h2>
        </header>

        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="PoliciesSubHeader text-xs font-black uppercase tracking-widest text-rose-600 italic">
              A. Printing Variance Disclaimer
            </h3>
            <p className="PoliciesParagraph text-sm leading-relaxed text-slate-600 font-bold">
              As a condition of sale, customers acknowledge: Minor misprints in marginal quantities (e.g., 1-3 units in a batch of 100) DO NOT justify a full refund of the entire order. 
            </p>
            <p className="PoliciesParagraph text-sm leading-relaxed text-slate-600">
              Mass production inherently involves small acceptable variances. Global industrial tolerance percentages apply to all bulk orders. Requests for entire-batch refunds due to isolated, minor defects will be summarily denied.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="PoliciesSubHeader text-xs font-black uppercase tracking-widest text-slate-900 italic">
              B. Remedial Actions for Partial Damage
            </h3>
            <p className="PoliciesParagraph text-sm leading-relaxed text-slate-600">
              In cases where production defects are verified, PIXS Printing Shop reserves the sole discretion to offer the following remedies:
            </p>
            <ul className="PoliciesList ml-4 list-disc space-y-2 text-sm text-slate-600">
              <li>Reproduction/Reprint of the specific affected quantity only; OR</li>
              <li>Issuance of credit to be applied to the customer's next official order; OR</li>
              <li>Partial refund proportional to the defective quantity.</li>
            </ul>
            <p className="text-xs font-black uppercase text-rose-500 italic">Full refund of non-defective portions is strictly prohibited.</p>
          </div>

          <div className="space-y-3">
            <h3 className="PoliciesSubHeader text-xs font-black uppercase tracking-widest text-rose-600 italic">
              C. Logistics & Courier Liability Transfer
            </h3>
            <p className="PoliciesParagraph text-sm leading-relaxed text-slate-600 font-bold border-l-4 border-rose-500 pl-4 py-2 bg-rose-50/50">
              CRITICAL: LIABILITY TRANSFERS UPON RELEASE. Once items are released to a third-party courier (e.g., Lalamove, Grab, J&T), PIXS Printing Shop is no longer liable for the physical condition, security, or handling of the package.
            </p>
            <p className="PoliciesParagraph text-sm leading-relaxed text-slate-600">
              PIXS is responsible only for professional printing and secure packaging before turnover. Damage sustained during transit, courier negligence, or mishandling by delivery personnel is the sole responsibility of the courier provider. Customers must coordinate damage claims directly with the respective courier company.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="PoliciesSubHeader text-xs font-black uppercase tracking-widest text-slate-900 italic">
              D. Custom & Made-to-Order Restrictions
            </h3>
            <p className="PoliciesParagraph text-sm leading-relaxed text-slate-600">
              Customized products involve personalized labor and materials; therefore, they are non-refundable except in instances of major production failure. Discrepancies between screen brightness (monitor) and physical ink absorption (print) are not valid grounds for a claim.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="PoliciesSubHeader text-xs font-black uppercase tracking-widest text-slate-900 italic">
              E. Formal Claim Protocol
            </h3>
            <p className="PoliciesParagraph text-sm leading-relaxed text-slate-600">
              All claims must be submitted to the PIXS resolution node within five (5) working days of receipt. Submissions MUST include clear high-resolution photographic evidence of the alleged defect. Claims submitted beyond this period shall be considered waived by the Customer.
            </p>
          </div>

          <div className="pt-6">
            <a 
              href="mailto:legal@pixs.com" 
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-pixs-mint shadow-xl hover:scale-105 transition-all italic"
            >
              Contact Legal Dept <FiExternalLink />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PoliciesSection;
