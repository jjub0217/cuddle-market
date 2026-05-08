'use client'

export default function HomeHero() {
  return (
    <section
      aria-label="히어로"
      className="relative h-130 w-full overflow-hidden md:h-162.5"
      style={{ backgroundColor: '#e2cbb2' }}
    >
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="반려동물과 함께하는 따뜻한 마켓"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxuIgWc6PX7n6vl_OVSBIn92DU2D7zwOVChB9mNdgVh-eKQln4K4hdS2e0bKV7TE-QvJ55mbChSzWsvS6S56fri1iH9jGIPNYog400flI7tXFX3_SOM4F6o3avX-LVPv0FgXnNISCGnA3-pJ0_BNIRWfh6FJvqPTHldSAXHYRmTLO8F-Dr_REELfi_jH2X2PjvHtPNWI8zN2m8_0wuwciJ8P2WQN4N972ETvicm7qrvxLkuZwZM0U0wtm20SC-7Z3bsd8Emu8q1E5H"
          className="h-full w-full object-cover object-bottom"
        />
      </div>
    </section>
  )
}
