import React from 'react'

interface MobileHeroSectionProps {
  onCTA?: () => void
}

const MobileHeroSection: React.FC<MobileHeroSectionProps> = () => {
  return (
    <section
      className="fixed top-0 left-0 right-0 z-[1px] w-full max-w-none flex items-end justify-start px-6 pb-8 pt-6"
      style={{
        height: '325px',
        backgroundColor: '#2ff29e',
      }}
      aria-label="Welcome to PIXS Printing Shop"
    >
      <div className="flex flex-col justify-end text-white">
        <h1 className="text-3xl font-black tracking-tight leading-tight">
          Welcome to PIXS
          <br />Printing Shop!
        </h1>
        <p className="text-[10px] pt-2 font-bold tracking-widest uppercase">
          Your One-Stop Print & <br />Design Solution
        </p>
      </div>
    </section>
  )
}

export default MobileHeroSection
