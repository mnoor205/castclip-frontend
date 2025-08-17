import PricingSection from "@/components/pricing/pricing-section";


export default function CreditsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <PricingSection 
        title="Flexible Plans for Every Creator"
        description="Simple, transparent pricing. No subscriptions, no hidden fees. Credits never expire, and every new user gets 10 free credits to start!"
        showHeader={true}
      />
    </div>
  );
}