'use client'

import { useState, useEffect, useRef, JSX, ReactElement, Suspense } from 'react'
import SuccessMessage from '@/components/SuccessMessage'

// Define types
type TicketType = 'standard' | 'early_bird' | 'supporter' | 'volunteer' | 'day_pass_fri' | 'day_pass' | 'full_access_early_bird' | 'student' | 'upgrade'

// Define heard from options
const HEARD_FROM_OPTIONS = [
  { value: "", label: "Select an option" },
  { value: "friend-or-acquaintance", label: "Friend or Acquaintance" },
  { value: "i-was-there-last-year", label: "I was there last year" },
  { value: "lesswrong", label: "LessWrong" },
  { value: "ea-forum", label: "EA Forum" },
  { value: "manifold", label: "Manifold" },
  { value: "lightcone", label: "Lightcone" },
  { value: "twitter", label: "Twitter" },
  { value: "acx", label: "ACX" },
  { value: "other-blog", label: "Other Blog" },
  { value: "newsletter", label: "Newsletter" },
  { value: "podcast", label: "Podcast" },
  { value: "discord", label: "Discord" },
  { value: "tumblr", label: "Tumblr" },
  { value: "twitch", label: "Twitch" },
  { value: "other", label: "Other" }
];

interface TicketPrices {
  [eventType: string]: {
    [ticketType: string]: number
  }
}

interface Ticket {
  eventType: string
  type: TicketType
  quantity: number
  day?: number
}

interface AttendeeInfo {
  firstName: string
  lastName: string
  badgeName?: string
  manifoldUsername?: string
  lwUsername?: string
  dietaryPreferences: string[]
  dietaryOther?: string
  heardFromManifest: string
  heardFromLessOnline: string
  under18: string
  bringingKids: string
}

interface CounterProps {
  eventType: string
  ticketType: string
  quantity: number
  onQuantityChange: (eventType: string, ticketType: string, quantity: number) => void
}

// Type mapping from event/ticket types to display names
const EVENT_TYPE_DISPLAY = {
  lessonline: {
    early_bird: "LessOnline Early Bird",
    standard: "LessOnline",
    supporter: "LessOnline Supporter",
    volunteer: "LessOnline Volunteer",
    day_pass_fri: "LessOnline Half Day Pass (Fri)",
    day_pass: "LessOnline Day Pass",
    upgrade: "LessOnline Upgrade",
  },
  manifest: {
    early_bird: "Manifest Early Bird",
    standard: "Manifest",
    supporter: "Manifest Supporter",
    student: "Manifest Student",
    volunteer: "Manifest Volunteer",
    day_pass_fri: "Manifest Half Day Pass (Fri)",
    day_pass: "Manifest Day Pass",
  },
  summer_camp: {
    early_bird: "Summer Camp Early Bird",
    standard: "Summer Camp",
    supporter: "Summer Camp Supporter",
    day_pass: "Summer Camp Day Pass",
    day_pass_fri: "Summer Camp Half Day Pass (Fri)",
  },
  all_access: {
    early_bird: "All-Access Early Bird",
    supporter: "All-Access Supporter",
  }
};

// Define an interface for the SelectionSummaryItem props to use for type checking
interface SelectionSummaryItemProps {
  eventType: string;
  ticketType: string;
  quantity: number;
  price: number;
  isDiscounted?: boolean;
  originalPrice?: number;
  discountAmount?: number;
}

// Ticket counter component
function TicketCounter({ eventType, ticketType, quantity, onQuantityChange }: CounterProps) {
  // Check if the ticket is a day pass type
  const isDayPass = ticketType === 'day_pass' || ticketType === 'day_pass_fri';
  
  return (
    <div className="ticket-counter">
      <button 
        className="counter-btn minus"
        onClick={() => quantity > 0 && onQuantityChange(eventType, ticketType, isDayPass ? quantity - 1 : 0)}
        aria-label={isDayPass ? "Decrease quantity" : "Remove ticket"}
      >-</button>
      <span className="quantity-display">{quantity}</span>
      <button 
        className={`counter-btn plus ${!isDayPass && quantity === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => isDayPass ? onQuantityChange(eventType, ticketType, quantity + 1) : (quantity < 1 && onQuantityChange(eventType, ticketType, 1))}
        disabled={!isDayPass && quantity === 1}
        aria-label={isDayPass ? "Increase quantity" : "Add ticket"}
      >+</button>
    </div>
  )
}

// Ticket card component
function TicketCard({ 
  eventType, 
  ticketType, 
  name, 
  description, 
  price, 
  logoUrl,
  special = false,
  quantity,
  onQuantityChange 
}: { 
  eventType: string
  ticketType: string
  name: string
  description: string
  price: number
  logoUrl: string
  special?: boolean
  quantity: number
  onQuantityChange: (eventType: string, ticketType: string, quantity: number) => void
}) {
  return (
    <div className={`min-h-[200px] bg-white/80 rounded-lg shadow-lg relative ${special ? 'bg-gradient-to-br from-yellow-300 to-amber-400' : ''}`}>
      <div className="absolute inset-2 border-2 border-gray-900 rounded-lg"></div>
      <div className="h-full flex flex-col p-6 relative">
        <div className="flex items-center gap-4 mb-4">
          <img src={logoUrl} alt={name} className="w-14 h-14 mix-blend-multiply" />
          <h2 className="text-xl font-bold">{name}</h2>
        </div>
        <p className="text-lg flex-1 mb-4">
          {description}
        </p>
        <div className="flex justify-between items-center">
          <p className="text-xl font-bold">
            ${price}
          </p>
          <div className="flex items-center gap-4">
            <TicketCounter
              eventType={eventType}
              ticketType={ticketType}
              quantity={quantity}
              onQuantityChange={onQuantityChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Day pass section component
function DayPassSection({
  eventType,
  title,
  days,
  logoUrl,
  prices,
  quantities,
  hotFood,
  onQuantityChange
}: {
  eventType: string
  title: string
  days: { type: string, label: string, description: string }[]
  logoUrl: string
  prices: TicketPrices
  quantities: Record<string, Record<string, number>>
  hotFood: boolean
  onQuantityChange: (eventType: string, ticketType: string, quantity: number) => void
}) {
  return (
    <div className="bg-white/80 p-6 rounded-lg shadow-lg relative font-serif">
      <div className="absolute inset-2 border-2 border-gray-900 rounded-lg"></div>
      <div className="relative">
        <div className="flex items-center gap-4 mb-6">
          <img src={logoUrl} alt={title} className="w-16 h-16 mix-blend-multiply" />
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-lg mb-4">1-day access{hotFood ? ', including hot meals' : ', meals available for purchase'}</p>
        <div className="">
          {days.map((day) => (
            <div key={day.type} className="flex justify-between gap-4 items-start rounded-lg mb-4">
              <div>
                <h4 className="font-semibold leading-none [font-variant:small-caps]">{day.label}</h4>
                <p className="text-sm leading-none">{day.description}</p>
              </div>
              <div className="flex gap-4">
                <p className="font-bold">${prices[eventType][day.type]}</p>
                <TicketCounter
                  eventType={eventType}
                  ticketType={day.type}
                  quantity={quantities[eventType]?.[day.type] || 0}
                  onQuantityChange={onQuantityChange}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Selection summary item component
function SelectionSummaryItem({ 
  eventType, 
  ticketType, 
  quantity, 
  price,
  isDiscounted = false,
  originalPrice,
  discountAmount 
}: SelectionSummaryItemProps) {
  const displayName = EVENT_TYPE_DISPLAY[eventType]?.[ticketType] || `${eventType} ${ticketType}`;
  
  return (
    <div className="flex justify-between items-center bg-white/80 p-4 rounded-lg">
      <div className="flex items-center gap-4">
        <span className="font-medium">{quantity} × {displayName}{isDiscounted ? ' (Discounted)' : ''}</span>
      </div>
      <div className="text-right">
        {isDiscounted ? (
          <div>
            <div className="text-gray-600 line-through text-sm">${originalPrice?.toFixed(2)}</div>
            <div>${price.toFixed(2)} <span className="text-green-600 text-sm">(-${discountAmount?.toFixed(2)})</span></div>
          </div>
        ) : (
          <span className="text-gray-600">${price * quantity}</span>
        )}
      </div>
    </div>
  );
}

// New TicketGrid component
function TicketGrid({
  prices,
  ticketQuantities,
  onQuantityChange,
  showMoreSpecialTickets,
  setShowMoreSpecialTickets
}: {
  prices: TicketPrices
  ticketQuantities: Record<string, Record<string, number>>
  onQuantityChange: (eventType: string, ticketType: string, quantity: number) => void
  showMoreSpecialTickets: boolean
  setShowMoreSpecialTickets: (show: boolean) => void
}) {
  return (
    <div className="mb-12 max-w-6xl mx-auto">
      <div className="wooden-sign section-sign tickets-sign mx-auto py-4 px-5 rounded-lg relative mb-8">
        <div className="nail-top-left"></div>
        <div className="nail-top-right"></div>
        <div className="nail-bottom-left"></div>
        <div className="nail-bottom-right"></div>
        <h2 className="carved-text text-3xl font-bold [font-variant:small-caps] text-center">
          Event Tickets
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* LessOnline Ticket */}
        <TicketCard
          eventType="lessonline"
          ticketType="early_bird"
          name="LessOnline Ticket"
          description="Full-access to LessOnline, from Friday evening through end of Sunday. 5 hot meals included."
          price={prices.lessonline.early_bird}
          logoUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1742423245/LessOnlineLogo_pmim6f.png"
          quantity={ticketQuantities.lessonline?.early_bird || 0}
          onQuantityChange={onQuantityChange}
        />
        
        {/* Summer Camp Ticket */}
        <TicketCard
          eventType="summer_camp"
          ticketType="early_bird"
          name="Mystery Summer Camp Ticket"
          description="Full-access to a new, experimental summer camp from Monday to Friday afternoon. 9 hot meals included."
          price={prices.summer_camp.early_bird}
          logoUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1742618580/image_10_iozgiw-removebg-preview_tnxequ.png"
          quantity={ticketQuantities.summer_camp?.early_bird || 0}
          onQuantityChange={onQuantityChange}
        />
        
        {/* Manifest Ticket */}
        <TicketCard
          eventType="manifest"
          ticketType="early_bird"
          name="Manifest Ticket"
          description="Full-access to Manifest, from Friday evening through end of Sunday. 5 hot meals included."
          price={prices.manifest.early_bird}
          logoUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1742583373/Manifold_Logo_dofoj6.png"
          quantity={ticketQuantities.manifest?.early_bird || 0}
          onQuantityChange={onQuantityChange}
        />

        <TicketCard
          eventType="all_access"
          ticketType="early_bird"
          name="All-Access Festival Ticket"
          description="Full-access to LessOnline, Manifest, and the new summer camp, including all conference sessions and activities. 19 hot meals included."
          price={prices.all_access.early_bird}
          logoUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1742423245/LessOnlineLogo_pmim6f.png"
          quantity={ticketQuantities.all_access?.early_bird || 0}
          onQuantityChange={onQuantityChange}
          special={true}
        />
      </div>

      <div className="wooden-sign section-sign special-sign mx-auto py-4 px-5 rounded-lg relative mb-8">
        <div className="nail-top-left"></div>
        <div className="nail-top-right"></div>
        <div className="nail-bottom-left"></div>
        <div className="nail-bottom-right"></div>
        <h2 className="carved-text text-3xl font-bold [font-variant:small-caps] text-center">
          Special Tickets
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* LessOnline Supporter Ticket */}
        <TicketCard
          eventType="lessonline"
          ticketType="supporter"
          name="LessOnline Supporter Ticket"
          description="Show your support for Lighthaven and LessWrong with this supporter ticket."
          price={prices.lessonline.supporter}
          logoUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1742423245/LessOnlineLogo_pmim6f.png"
          quantity={ticketQuantities.lessonline?.supporter || 0}
          onQuantityChange={onQuantityChange}
        />
        
        {/* Manifest Supporter Ticket */}
        <TicketCard
          eventType="manifest"
          ticketType="supporter"
          name="Manifest Supporter Ticket"
          description="Show your support for Manifest and Manifold with this supporter ticket."
          price={prices.manifest.supporter}
          logoUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1742583373/Manifold_Logo_dofoj6.png"
          quantity={ticketQuantities.manifest?.supporter || 0}
          onQuantityChange={onQuantityChange}
        />
        
        {/* LessOnline Volunteer Ticket */}
        <TicketCard
          eventType="lessonline"
          ticketType="volunteer"
          name="LessOnline Volunteer Ticket"
          description="This is a volunteer ticket for LessOnline. It signs you up for 3 x 4-hour shifts across the weekend. After completing your shifts satisfactorily, you are eligible for a full-refund. There are 50 volunteer tickets available."
          price={prices.lessonline.volunteer}
          logoUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1742423245/LessOnlineLogo_pmim6f.png"
          quantity={ticketQuantities.lessonline?.volunteer || 0}
          onQuantityChange={onQuantityChange}
        />
        
        {/* LessOnline Upgrade Ticket */}
        <TicketCard
          eventType="lessonline"
          ticketType="upgrade"
          name="LessOnline Upgrade Ticket"
          description="For those who already purchased a LessOnline ticket and wish to upgrade to full access."
          price={prices.lessonline.upgrade}
          logoUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1742423245/LessOnlineLogo_pmim6f.png"
          quantity={ticketQuantities.lessonline?.upgrade || 0}
          onQuantityChange={onQuantityChange}
        />

        {/* Manifest Student Ticket */}
        <TicketCard
          eventType="manifest"
          ticketType="student"
          name="Manifest Student Ticket"
          description="Discount for students enrolled in high school or university."
          price={prices.manifest.student}
          logoUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1742583373/Manifold_Logo_dofoj6.png"
          quantity={ticketQuantities.manifest?.student || 0}
          onQuantityChange={onQuantityChange}
        />
        
        {/* Manifest Volunteer Ticket */}
        <TicketCard
          eventType="manifest"
          ticketType="volunteer"
          name="Manifest Volunteer Ticket"
          description="This is a volunteer ticket for Manifest. It signs you up for 3 x 4-hour shifts across the weekend. There are 30 volunteer tickets available."
          price={prices.manifest.volunteer}
          logoUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1742583373/Manifold_Logo_dofoj6.png"
          quantity={ticketQuantities.manifest?.volunteer || 0}
          onQuantityChange={onQuantityChange}
        />

        {!showMoreSpecialTickets && (
          <div className="md:col-span-2 flex justify-center mt-4">
            <button 
              onClick={() => setShowMoreSpecialTickets(true)}
              className="cursor-pointer bg-white text-black py-3 px-6 rounded-lg font-semibold text-lg border-2 border-black hover:bg-gray-100 transition-colors"
            >
              Load More Special Tickets
            </button>
          </div>
        )}
        
        {showMoreSpecialTickets && (
          <>
            {/* Summer Camp Supporter Ticket */}
            <TicketCard
              eventType="summer_camp"
              ticketType="supporter"
              name="Summer Camp Supporter Ticket"
              description="Show your support for the Mystery Summer Camp with this supporter ticket."
              price={prices.summer_camp.supporter}
              logoUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1742618580/image_10_iozgiw-removebg-preview_tnxequ.png"
              quantity={ticketQuantities.summer_camp?.supporter || 0}
              onQuantityChange={onQuantityChange}
            />
            
            {/* All-Access Supporter Ticket */}
            <TicketCard
              eventType="all_access"
              ticketType="supporter"
              name="All-Access Supporter Ticket"
              description="Premium supporter ticket that includes access to all events with special perks and experiences."
              price={prices.all_access.supporter}
              logoUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1742423245/LessOnlineLogo_pmim6f.png"
              special={true}
              quantity={ticketQuantities.all_access?.supporter || 0}
              onQuantityChange={onQuantityChange}
            />

            <div className="md:col-span-2 flex justify-center mt-4">
              <button 
                onClick={() => setShowMoreSpecialTickets(false)}
                className="cursor-pointer bg-white text-black py-3 px-6 rounded-lg font-semibold text-lg border-2 border-black hover:bg-gray-100 transition-colors"
              >
                Show Fewer Special Tickets
              </button>
            </div>
          </>
        )}
      </div>

      <div className="wooden-sign section-sign day-passes-sign mx-auto py-4 px-5 rounded-lg relative mb-8">
        <div className="nail-top-left"></div>
        <div className="nail-top-right"></div>
        <div className="nail-bottom-left"></div>
        <div className="nail-bottom-right"></div>
        <h2 className="carved-text text-3xl font-bold [font-variant:small-caps] text-center">
          Day Passes
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* LessOnline Day Passes */}
        <DayPassSection
          eventType="lessonline"
          title="LessOnline"
          days={[
            { 
              type: 'day_pass_fri', 
              label: 'Friday, May 30', 
              description: 'Half Day' 
            },
            { 
              type: 'day_pass', 
              label: 'Saturday, May 31 or Sunday, June 1', 
              description: 'Full Day' 
            }
          ]}
          logoUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1742423245/LessOnlineLogo_pmim6f.png"
          prices={prices}
          quantities={ticketQuantities}
          onQuantityChange={onQuantityChange}
          hotFood={true}
        />
        
        {/* Summer Camp Day Passes */}
        <DayPassSection
          eventType="summer_camp"
          title="Summer Camp"
          days={[
            { 
              type: 'day_pass', 
              label: 'Day Pass', 
              description: 'one of Monday June 2 - Thursday June 5' 
            },
            { 
              type: 'day_pass_fri', 
              label: 'Friday, Jun 6', 
              description: 'Half Day' 
            }
          ]}
          logoUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1742618580/image_10_iozgiw-removebg-preview_tnxequ.png"
          prices={prices}
          quantities={ticketQuantities}
          onQuantityChange={onQuantityChange}
          hotFood={false}
        />
        
        {/* Manifest Day Passes */}
        <DayPassSection
          eventType="manifest"
          title="Manifest"
          days={[
            { 
              type: 'day_pass_fri', 
              label: 'Friday, Jun 6', 
              description: 'Day 1' 
            },
            { 
              type: 'day_pass', 
              label: 'Day Pass', 
              description: 'Day 2 or Day 3' 
            }
          ]}
          logoUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1742583373/Manifold_Logo_dofoj6.png"
          prices={prices}
          quantities={ticketQuantities}
          onQuantityChange={onQuantityChange}
          hotFood={true}
        />
      </div>
    </div>
  )
}

// New AttendeeFormSection component
function AttendeeFormSection({
  attendee,
  handleAttendeeChange,
  handleDietaryPreferenceChange,
  showDietaryOther,
  hasLessOnlineTickets,
  hasManifestTickets
}: {
  attendee: AttendeeInfo;
  handleAttendeeChange: (field: keyof AttendeeInfo, value: string) => void;
  handleDietaryPreferenceChange: (preference: string, isChecked: boolean) => void;
  showDietaryOther: boolean;
  hasLessOnlineTickets: boolean;
  hasManifestTickets: boolean;
}) {
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);

  // Handle toggling dietary options
  const toggleDietaryOptions = () => {
    setShowMoreOptions(prev => !prev);
  };

  return (
    <div className="w-full lg:w-1/2 font-sans bg-white/80 p-6 rounded-lg shadow-lg relative">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Attendee Information</h2>
      </div>

      <div className="space-y-8">
        <div className="attendee-form space-y-4 border-b border-gray-200 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                id="first-name"
                value={attendee.firstName}
                onChange={(e) => handleAttendeeChange('firstName', e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                id="last-name"
                value={attendee.lastName}
                onChange={(e) => handleAttendeeChange('lastName', e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="badge-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name for Badge (optional — if different from your first name)
            </label>
            <input
              type="text"
              id="badge-name"
              value={attendee.badgeName}
              onChange={(e) => handleAttendeeChange('badgeName', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="manifold-username" className="block text-sm font-medium text-gray-700 mb-1">
                Manifold Username (optional)
              </label>
              <input
                type="text"
                id="manifold-username"
                value={attendee.manifoldUsername}
                onChange={(e) => handleAttendeeChange('manifoldUsername', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="lw-username" className="block text-sm font-medium text-gray-700 mb-1">
                LessWrong Username (optional)
              </label>
              <input
                type="text"
                id="lw-username"
                value={attendee.lwUsername}
                onChange={(e) => handleAttendeeChange('lwUsername', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Preferences *</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
              {/* Always show first three options */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={attendee.dietaryPreferences?.includes('no-restrictions')}
                  onChange={(e) => handleDietaryPreferenceChange('no-restrictions', e.target.checked)}
                  className="mr-2"
                />
                No Restrictions
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={attendee.dietaryPreferences?.includes('vegetarian')}
                  onChange={(e) => handleDietaryPreferenceChange('vegetarian', e.target.checked)}
                  className="mr-2"
                />
                Vegetarian
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={attendee.dietaryPreferences?.includes('vegan')}
                  onChange={(e) => handleDietaryPreferenceChange('vegan', e.target.checked)}
                  className="mr-2"
                />
                Vegan
              </label>
              
              {/* Conditionally show more options */}
              {showMoreOptions && (
                <>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={attendee.dietaryPreferences?.includes('pescatarian')}
                      onChange={(e) => handleDietaryPreferenceChange('pescatarian', e.target.checked)}
                      className="mr-2"
                    />
                    Pescatarian
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={attendee.dietaryPreferences?.includes('gluten-free')}
                      onChange={(e) => handleDietaryPreferenceChange('gluten-free', e.target.checked)}
                      className="mr-2"
                    />
                    Gluten-Free
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={attendee.dietaryPreferences?.includes('dairy-free')}
                      onChange={(e) => handleDietaryPreferenceChange('dairy-free', e.target.checked)}
                      className="mr-2"
                    />
                    Dairy-Free
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={attendee.dietaryPreferences?.includes('nut-free')}
                      onChange={(e) => handleDietaryPreferenceChange('nut-free', e.target.checked)}
                      className="mr-2"
                    />
                    Nut-Free
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={attendee.dietaryPreferences?.includes('low-carb')}
                      onChange={(e) => handleDietaryPreferenceChange('low-carb', e.target.checked)}
                      className="mr-2"
                    />
                    Low-Carb / Keto
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={attendee.dietaryPreferences?.includes('other')}
                      onChange={(e) => handleDietaryPreferenceChange('other', e.target.checked)}
                      className="mr-2"
                    />
                    Other (Please specify)
                  </label>
                </>
              )}
            </div>
            
            {/* Toggle button for more options */}
            <button
              type="button"
              onClick={toggleDietaryOptions}
              className="mt-2 border border-gray-600 rounded-md px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {showMoreOptions ? 'Show Fewer Options' : 'Show More Dietary Options'}
            </button>
            
            {showDietaryOther && (
              <div className="mt-2">
                <label htmlFor="dietary-other-text" className="block text-sm text-gray-600 mb-1">
                  Please specify other dietary restrictions
                </label>
                <input
                  type="text"
                  id="dietary-other-text"
                  value={attendee.dietaryOther}
                  onChange={(e) => handleAttendeeChange('dietaryOther', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter your dietary restrictions"
                />
              </div>
            )}
          </div>

          {hasLessOnlineTickets && (
            <div>
              <label htmlFor="heard-from-lessonline" className="block text-sm font-medium text-gray-700 mb-1">
                How did you hear about LessOnline? *
              </label>
              <select
                id="heard-from-lessonline"
                value={attendee.heardFromLessOnline}
                onChange={(e) => handleAttendeeChange('heardFromLessOnline', e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {HEARD_FROM_OPTIONS.map(option => (
                  <option key={`lessonline-${option.value}`} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          )}

          {hasManifestTickets && (
            <div>
              <label htmlFor="heard-from-manifest" className="block text-sm font-medium text-gray-700 mb-1">
                How did you hear about Manifest? *
              </label>
              <select
                id="heard-from-manifest"
                value={attendee.heardFromManifest}
                onChange={(e) => handleAttendeeChange('heardFromManifest', e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {HEARD_FROM_OPTIONS.map(option => (
                  <option key={`manifest-${option.value}`} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Will you be under 18 at the time of the event? *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="under-18"
                  value="yes"
                  checked={attendee.under18 === 'yes'}
                  onChange={() => handleAttendeeChange('under18', 'yes')}
                  required
                  className="mr-2"
                />
                Yes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="under-18"
                  value="no"
                  checked={attendee.under18 === 'no'}
                  onChange={() => handleAttendeeChange('under18', 'no')}
                  required
                  className="mr-2"
                />
                No
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Are you bringing children? *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="bringing-kids"
                  value="yes"
                  checked={attendee.bringingKids === 'yes'}
                  onChange={() => handleAttendeeChange('bringingKids', 'yes')}
                  required
                  className="mr-2"
                />
                Yes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="bringing-kids"
                  value="no"
                  checked={attendee.bringingKids === 'no'}
                  onChange={() => handleAttendeeChange('bringingKids', 'no')}
                  required
                  className="mr-2"
                />
                No
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// New PriceSummarySection component
function PriceSummarySection({
  totalAmount,
  appliedKarmaDiscount,
  appliedManaDiscount,
  showKarmaDiscount,
  showManaDiscount,
  karmaUsername,
  karmaPoints,
  manifoldUsername,
  setShowKarmaDiscount,
  setShowManaDiscount,
  setKarmaUsername,
  setKarmaPoints,
  setManifoldUsername,
  handleApplyKarmaDiscount,
  handleApplyManaDiscount,
  handleCheckout,
  isCheckoutEnabled,
  hasTicketsSelected,
  getSelectionSummaryItems
}: {
  totalAmount: number;
  appliedKarmaDiscount: number;
  appliedManaDiscount: number;
  showKarmaDiscount: boolean;
  showManaDiscount: boolean;
  karmaUsername: string;
  karmaPoints: string;
  manifoldUsername: string;
  setShowKarmaDiscount: (show: boolean) => void;
  setShowManaDiscount: (show: boolean) => void;
  setKarmaUsername: (username: string) => void;
  setKarmaPoints: (points: string) => void;
  setManifoldUsername: (username: string) => void;
  handleApplyKarmaDiscount: () => void;
  handleApplyManaDiscount: () => void;
  handleCheckout: () => void;
  isCheckoutEnabled: () => boolean;
  hasTicketsSelected: boolean;
  getSelectionSummaryItems: () => ReactElement<SelectionSummaryItemProps>[];
}) {
  return (
    <div className="w-full lg:w-1/2 flex flex-col font-sans">
      <h2 className="text-2xl font-semibold mb-6">Price Summary</h2>
      {/* Selection Summary */}
      {hasTicketsSelected && (
          <div className="mb-2">
            <div className="space-y-2">
              {getSelectionSummaryItems()}
            </div>
          </div>
        )}
      <div className="flex flex-col flex-grow">
        
        {appliedKarmaDiscount > 0 && (
          <div className="flex justify-between mt-2 border-2 border-black p-4 rounded-lg">
            <span>Karma Discount Applied</span>
            <span>-${appliedKarmaDiscount.toFixed(2)}</span>
          </div>
        )}
        
        {appliedManaDiscount > 0 && (
          <div className="flex justify-between mt-2 border-2 border-black p-4 rounded-lg">
            <span>Manifold Mana Discount Applied</span>
            <span>-${appliedManaDiscount.toFixed(2)}</span>
          </div>
        )}
        
        {appliedKarmaDiscount > 0 && appliedManaDiscount > 0 && (
          <div className="flex justify-between mt-2 border-2 border-black p-4 rounded-lg bg-gray-100">
            <span>Total Discount</span>
            <span>-${(appliedKarmaDiscount + appliedManaDiscount).toFixed(2)}</span>
          </div>
        )}
        
        <div className="mt-auto pt-6 border-t">
          <div className="flex justify-between text-xl font-semibold mb-6">
            <span>Total</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          
          <div className="flex gap-4 mb-6">
            {appliedKarmaDiscount === 0 && (
              <button 
                onClick={() => setShowKarmaDiscount(true)}
                className={`py-2 px-4 cursor-pointer rounded-lg font-medium border-2 border-black ${appliedManaDiscount > 0 ? 'w-full' : 'w-1/2 flex-grow'} md:whitespace-nowrap`}
              >
                Apply LessWrong Karma Discount
              </button>
            )}
            {appliedManaDiscount === 0 && (
              <button 
                onClick={() => setShowManaDiscount(true)}
                className={`py-2 px-4 cursor-pointer rounded-lg font-medium border-2 border-black ${appliedKarmaDiscount > 0 ? 'w-full' : 'w-1/2 flex-grow'} md:whitespace-nowrap`}
              >
                Apply Manifold Mana Discount
              </button>
            )}
          </div>
          
          {appliedKarmaDiscount === 0 && appliedManaDiscount === 0 ? null : (
            appliedKarmaDiscount > 0 && appliedManaDiscount > 0 ? (
              <div className="text-center text-sm text-gray-600 mb-6">
                Both discounts applied successfully
              </div>
            ) : null
          )}
          
          {showKarmaDiscount && (
            <div className="space-y-4 mb-6 rounded-lg">
              <div>
                <label htmlFor="lw-username" className="block text-sm font-medium mb-1">
                  LessWrong Username
                </label>
                <input 
                  type="text" 
                  id="lw-username" 
                  value={karmaUsername}
                  onChange={(e) => setKarmaUsername(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" 
                  required
                />
              </div>
              <div>
                <label htmlFor="lw-karma" className="block text-sm font-medium mb-1">
                  Karma Points
                </label>
                <input 
                  type="number" 
                  id="lw-karma" 
                  min="0" 
                  value={karmaPoints}
                  onChange={(e) => setKarmaPoints(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" 
                  required
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleApplyKarmaDiscount}
                  className="cursor-pointer bg-black text-white py-2 px-4 rounded-lg font-medium hover:bg-black/90 transition-colors"
                >
                  Apply Discount
                </button>
                <button 
                  onClick={() => setShowKarmaDiscount(false)}
                  className="cursor-pointer bg-white text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {showManaDiscount && (
            <div className="space-y-4 mb-6 bg-white/80 p-4 rounded-lg">
              <div>
                <label htmlFor="manifold-username" className="block text-sm font-medium mb-1">
                  Manifold Username
                </label>
                <input 
                  type="text" 
                  id="manifold-username" 
                  value={manifoldUsername}
                  onChange={(e) => setManifoldUsername(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" 
                  required
                />
              </div>
              <p className="text-sm text-gray-600">
                10% off Manifest tickets (excluding volunteer tickets) and $55 off All-Access tickets and LessOnline Upgrade tickets
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={handleApplyManaDiscount}
                  className="cursor-pointer bg-black text-white py-2 px-4 rounded-lg font-medium hover:bg-black/90 transition-colors"
                >
                  Apply Discount
                </button>
                <button 
                  onClick={() => setShowManaDiscount(false)}
                  className="cursor-pointer bg-white text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {appliedKarmaDiscount > 0 && (
            <div className="text-sm border-2 border-black mb-6 p-4 rounded-lg">
              <p>Applied karma discount: <span className="font-semibold">${appliedKarmaDiscount.toFixed(2)}</span></p>
              <p>Username: <span className="font-semibold">{karmaUsername}</span></p>
            </div>
          )}
          
          {appliedManaDiscount > 0 && (
            <div className="text-sm border-2 border-black mb-6 p-4 rounded-lg">
              <p>Applied Manifold discount: <span className="font-semibold">${appliedManaDiscount.toFixed(2)}</span></p>
              <p>Username: <span className="font-semibold">{manifoldUsername}</span></p>
            </div>
          )}
          
          <button 
            onClick={handleCheckout}
            className="cursor-pointer w-full bg-black text-white py-3 px-6 rounded-lg font-semibold hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isCheckoutEnabled()}
          >
            Proceed to Checkout
          </button>
          {hasTicketsSelected && !isCheckoutEnabled() && (
            <div className="text-center mt-2 text-amber-700 font-medium">
              Attendee info is needed
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Function to check if a user has tickets for a specific event
const checkHasEventTickets = (
  ticketQuantities: Record<string, Record<string, number>>, 
  eventType: string
): boolean => {
  // Check if there are direct tickets for this event
  const hasDirectTickets = Object.values(ticketQuantities[eventType] || {}).some(quantity => quantity > 0);
  
  // Check if there are full access tickets (which count for both)
  const hasFullAccessTickets = (ticketQuantities.all_access?.early_bird || 0) > 0;
  
  return hasDirectTickets || hasFullAccessTickets;
}

// Function to validate attendee information
const validateAttendee = (
  attendee: AttendeeInfo,
  hasManifestTickets: boolean,
  hasLessOnlineTickets: boolean
): { valid: boolean; errorMessage?: string } => {
  // Check for any empty required fields
  const hasEmptyFields = 
    !attendee.firstName?.trim() || 
    !attendee.lastName?.trim() || 
    !attendee.dietaryPreferences?.length || 
    (hasManifestTickets && !attendee.heardFromManifest?.trim()) || 
    (hasLessOnlineTickets && !attendee.heardFromLessOnline?.trim()) ||
    !attendee.under18?.trim() || 
    !attendee.bringingKids?.trim();

  if (hasEmptyFields) {
    return { valid: false, errorMessage: 'Please fill in all required fields' };
  }

  return { valid: true };
};

// Main ticket store component
export default function TicketStore({ 
  eventName, 
  eventSlug, 
  prices 
}: { 
  eventName: string
  eventSlug: string
  prices: TicketPrices
}) {
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, Record<string, number>>>({})
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalTickets, setTotalTickets] = useState(0)
  const [showMoreSpecialTickets, setShowMoreSpecialTickets] = useState(false)  
  const [attendee, setAttendee] = useState<AttendeeInfo>({
    firstName: '',
    lastName: '',
    badgeName: '',
    manifoldUsername: '',
    lwUsername: '',
    dietaryPreferences: [],
    dietaryOther: '',
    heardFromManifest: '',
    heardFromLessOnline: '',
    under18: '',
    bringingKids: ''
  })
  const [showKarmaDiscount, setShowKarmaDiscount] = useState(false)
  const [showManaDiscount, setShowManaDiscount] = useState(false)
  const [karmaUsername, setKarmaUsername] = useState('')
  const [karmaPoints, setKarmaPoints] = useState('')
  const [appliedKarmaDiscount, setAppliedKarmaDiscount] = useState(0)
  const [showDietaryOther, setShowDietaryOther] = useState<boolean>(false)
  const [manifoldUsername, setManifoldUsername] = useState('')
  const [appliedManaDiscount, setAppliedManaDiscount] = useState(0)
  
  // Initialize ticket quantities
  useEffect(() => {
    const initialQuantities: Record<string, Record<string, number>> = {}
    
    Object.keys(prices).forEach(eventType => {
      initialQuantities[eventType] = {}
      Object.keys(prices[eventType]).forEach(ticketType => {
        initialQuantities[eventType][ticketType] = 0
      })
    })
    
    setTicketQuantities(initialQuantities)
  }, [prices])

  // Update total amount when ticket quantities change
  useEffect(() => {
    let total = 0
    let tickets = 0
    
    Object.entries(ticketQuantities).forEach(([eventType, ticketTypes]) => {
      Object.entries(ticketTypes).forEach(([ticketType, quantity]) => {
        if (prices[eventType]?.[ticketType] && quantity > 0) {
          total += prices[eventType][ticketType] * quantity
          tickets += quantity
        }
      })
    })
    
    // Apply discounts if applicable
    total = Math.max(0, total - appliedKarmaDiscount - appliedManaDiscount)
    
    setTotalAmount(total)
    setTotalTickets(tickets)
  }, [ticketQuantities, prices, appliedKarmaDiscount, appliedManaDiscount])

  // Handle quantity changes
  const handleQuantityChange = (eventType: string, ticketType: string, quantity: number) => {
    setTicketQuantities(prev => ({
      ...prev,
      [eventType]: {
        ...prev[eventType],
        [ticketType]: quantity
      }
    }))
  }

  // Handle attendee field changes
  const handleAttendeeChange = (field: keyof AttendeeInfo, value: string) => {
    setAttendee(prev => ({ ...prev, [field]: value }))
  }

  // Handle dietary preference change
  const handleDietaryPreferenceChange = (preference: string, isChecked: boolean) => {
    setAttendee(prev => {
      const currentPreferences = [...(prev.dietaryPreferences || [])];
      
      if (isChecked) {
        // Add preference if not already included
        if (!currentPreferences.includes(preference)) {
          currentPreferences.push(preference);
        }
      } else {
        // Remove preference if it exists
        const prefIndex = currentPreferences.indexOf(preference);
        if (prefIndex !== -1) {
          currentPreferences.splice(prefIndex, 1);
        }
      }
      
      // Update showDietaryOther when 'other' is toggled
      if (preference === 'other') {
        setShowDietaryOther(isChecked);
      }
      
      return {
        ...prev,
        dietaryPreferences: currentPreferences
      };
    });
  }

  // Handle applying karma discount
  const handleApplyKarmaDiscount = () => {
    // Simple validation
    if (!karmaUsername || !karmaPoints || isNaN(Number(karmaPoints))) {
      alert('Please enter a valid username and karma points')
      return
    }
    
    const points = Number(karmaPoints)
    
    // Calculate total price of LessOnline tickets
    let lessOnlineTotal = 0
    Object.entries(ticketQuantities.lessonline || {}).forEach(([ticketType, quantity]) => {
      if (quantity > 0 && prices.lessonline?.[ticketType]) {
        lessOnlineTotal += prices.lessonline[ticketType] * quantity
      }
    })
    
    // Calculate total price of all-access tickets
    let allAccessTotal = 0
    Object.entries(ticketQuantities.all_access || {}).forEach(([ticketType, quantity]) => {
      if (quantity > 0 && prices.all_access?.[ticketType]) {
        allAccessTotal += prices.all_access[ticketType] * quantity
      }
    })
    
    const eligibleTotal = lessOnlineTotal + allAccessTotal
    
    // One dollar per karma discount (capped by total eligible tickets price)
    const discountAmount = Math.min(points / 100, eligibleTotal)
    
    setAppliedKarmaDiscount(discountAmount)
    setShowKarmaDiscount(false)
  }

  // Handle applying mana discount
  const handleApplyManaDiscount = () => {
    // Simple validation
    if (!manifoldUsername) {
      alert('Please enter a valid Manifold username')
      return
    }
    
    // Calculate discount for Manifest tickets (10% off)
    let manifestDiscount = 0
    Object.entries(ticketQuantities.manifest || {}).forEach(([ticketType, quantity]) => {
      // Skip volunteer tickets
      if (ticketType !== 'volunteer' && quantity > 0 && prices.manifest?.[ticketType]) {
        manifestDiscount += prices.manifest[ticketType] * quantity * 0.1
      }
    })
    
    // Add discount for all-access tickets and LessOnline Upgrade tickets ($55 off each)
    let allAccessDiscount = 0
    Object.entries(ticketQuantities.all_access || {}).forEach(([ticketType, quantity]) => {
      if (quantity > 0 && prices.all_access?.[ticketType]) {
        allAccessDiscount += 55 * quantity
      }
    })
    
    // Add discount for LessOnline Upgrade tickets ($55 off each)
    let upgradeDiscount = 0
    if (ticketQuantities.lessonline?.upgrade) {
      const upgradeQuantity = ticketQuantities.lessonline.upgrade
      if (upgradeQuantity > 0) {
        upgradeDiscount += 55 * upgradeQuantity
      }
    }
    
    const totalDiscount = manifestDiscount + allAccessDiscount + upgradeDiscount
    
    setAppliedManaDiscount(totalDiscount)
    setShowManaDiscount(false)
  }

  // Handle checkout
  const handleCheckout = async () => {
    try {
      // Check if users have tickets for each event type
      const hasManifestTickets = checkHasEventTickets(ticketQuantities, 'manifest');
      const hasLessOnlineTickets = checkHasEventTickets(ticketQuantities, 'lessonline');
      
      // Validate all required fields are filled
      const validationResult = validateAttendee(attendee, hasManifestTickets, hasLessOnlineTickets);

      if (!validationResult.valid) {
        alert(validationResult.errorMessage);
        return;
      }

      // Prepare ticket data
      const tickets = [];
      for (const [eventType, eventTickets] of Object.entries(ticketQuantities)) {
        for (const [ticketType, quantity] of Object.entries(eventTickets)) {
          if (quantity > 0) {
            tickets.push({
              eventType,
              type: ticketType,
              quantity
            });
          }
        }
      }

      // Prepare discount data if applicable
      let discountData = null;
      if (appliedKarmaDiscount > 0 || appliedManaDiscount > 0) {
        discountData = {
          discounts: []
        };
        
        if (appliedKarmaDiscount > 0) {
          discountData.discounts.push({
            type: 'karma',
            username: karmaUsername,
            points: Number(karmaPoints),
            amount: appliedKarmaDiscount
          });
        }
        
        if (appliedManaDiscount > 0) {
          discountData.discounts.push({
            type: 'mana',
            username: manifoldUsername,
            amount: appliedManaDiscount
          });
        }
      }

      // Call the correct API endpoint
      const response = await fetch(`/api/festival-tickets/calculate/${eventSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tickets,
          attendees: [attendee],
          discount: discountData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('An error occurred during checkout. Please try again.');
    }
  }
  
  // Check if checkout button should be enabled
  const isCheckoutEnabled = () => {
    if (totalTickets === 0) return false
    
    // Check if users have tickets for each event type
    const hasManifestTickets = checkHasEventTickets(ticketQuantities, 'manifest');
    const hasLessOnlineTickets = checkHasEventTickets(ticketQuantities, 'lessonline');
    
    // Validate required attendee fields
    return validateAttendee(attendee, hasManifestTickets, hasLessOnlineTickets).valid;
  }

  // Calculate how many tickets have been selected
  const hasTicketsSelected = Object.values(ticketQuantities).some(ticketTypes => 
    Object.values(ticketTypes).some(quantity => quantity > 0)
  )

  // Get selection summary items with discount applied
  const getSelectionSummaryItems = () => {
    const items: ReactElement<SelectionSummaryItemProps>[] = []
    let remainingKarmaDiscount = appliedKarmaDiscount
    let remainingManaDiscount = appliedManaDiscount
    
    // First, handle LessOnline tickets with karma discount
    if (remainingKarmaDiscount > 0) {
      // Sort LessOnline tickets by price (descending) to apply discount to most expensive tickets first
      const lessOnlineItems = Object.entries(ticketQuantities.lessonline || {})
        .filter(([_, quantity]) => quantity > 0)
        .map(([ticketType, quantity]) => ({
          eventType: 'lessonline',
          ticketType,
          quantity,
          price: prices.lessonline?.[ticketType] || 0
        }))
        .sort((a, b) => b.price - a.price);

      // Apply discount to LessOnline tickets
      for (const item of lessOnlineItems) {
        if (remainingKarmaDiscount <= 0) break;
        
        const originalPrice = item.price;
        const totalItemPrice = originalPrice * item.quantity;
        
        // Apply discount to this item
        const itemDiscount = Math.min(remainingKarmaDiscount, totalItemPrice);
        const discountedPrice = (totalItemPrice - itemDiscount) / item.quantity;
        
        items.push(
          <SelectionSummaryItem
            key={`lessonline-${item.ticketType}`}
            eventType="lessonline"
            ticketType={item.ticketType}
            quantity={item.quantity}
            price={discountedPrice}
            isDiscounted={true}
            originalPrice={originalPrice}
            discountAmount={itemDiscount / item.quantity}
          />
        );
        
        remainingKarmaDiscount -= itemDiscount;
      }

      // Then handle All-Access tickets with remaining karma discount
      if (remainingKarmaDiscount > 0) {
        // Sort All-Access tickets by price (descending)
        const allAccessItems = Object.entries(ticketQuantities.all_access || {})
          .filter(([_, quantity]) => quantity > 0)
          .map(([ticketType, quantity]) => ({
            eventType: 'all_access',
            ticketType,
            quantity,
            price: prices.all_access?.[ticketType] || 0
          }))
          .sort((a, b) => b.price - a.price);

        // Apply discount to All-Access tickets
        for (const item of allAccessItems) {
          if (remainingKarmaDiscount <= 0) break;
          
          const originalPrice = item.price;
          const totalItemPrice = originalPrice * item.quantity;
          
          // Apply discount to this item
          const itemDiscount = Math.min(remainingKarmaDiscount, totalItemPrice);
          const discountedPrice = (totalItemPrice - itemDiscount) / item.quantity;
          
          items.push(
            <SelectionSummaryItem
              key={`all_access-${item.ticketType}`}
              eventType="all_access"
              ticketType={item.ticketType}
              quantity={item.quantity}
              price={discountedPrice}
              isDiscounted={true}
              originalPrice={originalPrice}
              discountAmount={itemDiscount / item.quantity}
            />
          );
          
          remainingKarmaDiscount -= itemDiscount;
        }
      }
    } else {
      // No karma discount, handle LessOnline tickets normally
      Object.entries(ticketQuantities.lessonline || {}).forEach(([ticketType, quantity]) => {
        if (quantity > 0 && prices.lessonline?.[ticketType]) {
          items.push(
            <SelectionSummaryItem
              key={`lessonline-${ticketType}`}
              eventType="lessonline"
              ticketType={ticketType}
              quantity={quantity}
              price={prices.lessonline[ticketType]}
            />
          )
        }
      })
    }
    
    // Handle Manifest tickets with Mana discount
    if (remainingManaDiscount > 0) {
      // First handle Manifest tickets (10% discount)
      Object.entries(ticketQuantities.manifest || {}).forEach(([ticketType, quantity]) => {
        if (quantity > 0 && prices.manifest?.[ticketType]) {
          const originalPrice = prices.manifest[ticketType]
          
          // Skip volunteer tickets for the discount
          if (ticketType !== 'volunteer') {
            const discountPerTicket = originalPrice * 0.1
            const totalDiscount = discountPerTicket * quantity
            const discountedPrice = originalPrice - discountPerTicket
            
            items.push(
              <SelectionSummaryItem
                key={`manifest-${ticketType}`}
                eventType="manifest"
                ticketType={ticketType}
                quantity={quantity}
                price={discountedPrice}
                isDiscounted={true}
                originalPrice={originalPrice}
                discountAmount={discountPerTicket}
              />
            )
            
            remainingManaDiscount -= totalDiscount
          } else {
            // No discount for volunteer tickets
            items.push(
              <SelectionSummaryItem
                key={`manifest-${ticketType}`}
                eventType="manifest"
                ticketType={ticketType}
                quantity={quantity}
                price={originalPrice}
              />
            )
          }
        }
      })
      
      // Then handle All-Access tickets with Mana discount ($55 discount each)
      // These may already have karma discount applied, but we'll handle that when displaying
      const allAccessItemsWithKarmaDiscount = items.filter(item => 
        item.props.eventType === 'all_access' && 
        item.props.isDiscounted
      );
      
      const allAccessItemsForManaDiscount = Object.entries(ticketQuantities.all_access || {})
        .filter(([ticketType, quantity]) => 
          quantity > 0 && 
          !allAccessItemsWithKarmaDiscount.some(item => 
            item.props.ticketType === ticketType
          )
        );

      allAccessItemsForManaDiscount.forEach(([ticketType, quantity]) => {
        if (remainingManaDiscount > 0 && prices.all_access?.[ticketType]) {
          const originalPrice = prices.all_access[ticketType]
          const discountPerTicket = 55
          const discountedPrice = originalPrice - discountPerTicket
          
          items.push(
            <SelectionSummaryItem
              key={`all_access-${ticketType}`}
              eventType="all_access"
              ticketType={ticketType}
              quantity={quantity}
              price={discountedPrice}
              isDiscounted={true}
              originalPrice={originalPrice}
              discountAmount={discountPerTicket}
            />
          )
          
          remainingManaDiscount -= discountPerTicket * quantity
        }
      });
      
      // Handle LessOnline Upgrade tickets with Mana discount ($55 discount each)
      if (ticketQuantities.lessonline?.upgrade && ticketQuantities.lessonline.upgrade > 0 && remainingManaDiscount > 0) {
        const ticketType = 'upgrade';
        const quantity = ticketQuantities.lessonline.upgrade;
        const originalPrice = prices.lessonline[ticketType];
        const discountPerTicket = 55;
        const discountedPrice = originalPrice - discountPerTicket;
        
        items.push(
          <SelectionSummaryItem
            key={`lessonline-${ticketType}`}
            eventType="lessonline"
            ticketType={ticketType}
            quantity={quantity}
            price={discountedPrice}
            isDiscounted={true}
            originalPrice={originalPrice}
            discountAmount={discountPerTicket}
          />
        );
        
        remainingManaDiscount -= discountPerTicket * quantity;
      }
      
      // Add Summer Camp tickets normally
      Object.entries(ticketQuantities.summer_camp || {}).forEach(([ticketType, quantity]) => {
        if (quantity > 0 && prices.summer_camp?.[ticketType]) {
          items.push(
            <SelectionSummaryItem
              key={`summer_camp-${ticketType}`}
              eventType="summer_camp"
              ticketType={ticketType}
              quantity={quantity}
              price={prices.summer_camp[ticketType]}
            />
          )
        }
      })
    } else {
      // No Mana discount
      
      // Handle all-access tickets not already displayed with Karma discount
      const allAccessItemsWithDiscount = items.filter(item => 
        item.props.eventType === 'all_access'
      );
      
      const allAccessItemsToAdd = Object.entries(ticketQuantities.all_access || {})
        .filter(([ticketType, quantity]) => 
          quantity > 0 && 
          !allAccessItemsWithDiscount.some(item => 
            item.props.ticketType === ticketType
          )
        );
        
      allAccessItemsToAdd.forEach(([ticketType, quantity]) => {
        if (prices.all_access?.[ticketType]) {
          items.push(
            <SelectionSummaryItem
              key={`all_access-${ticketType}`}
              eventType="all_access"
              ticketType={ticketType}
              quantity={quantity}
              price={prices.all_access[ticketType]}
            />
          )
        }
      });
      
      // Handle other event tickets normally
      ['manifest', 'summer_camp'].forEach(eventType => {
        Object.entries(ticketQuantities[eventType] || {}).forEach(([ticketType, quantity]) => {
          if (quantity > 0 && prices[eventType]?.[ticketType]) {
            items.push(
              <SelectionSummaryItem
                key={`${eventType}-${ticketType}`}
                eventType={eventType}
                ticketType={ticketType}
                quantity={quantity}
                price={prices[eventType][ticketType]}
              />
            )
          }
        })
      })
    }
    
    return items
  }

  return (
    <div className="bg-[url('https://res.cloudinary.com/lesswrong-2-0/image/upload/q_auto,f_auto/v1741125515/parchment_z3s9da.png')] bg-cover bg-center bg-fixed text-black m-0 p-0 relative z-0 w-full overflow-x-hidden font-serif">
      <style jsx global>{`
        @font-face {
          font-family: 'Bembo Book';
          src: url('/fonts/BemboBookMTStd-Regular.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Bembo Book';
          src: url('/fonts/BemboBookMTStd-Italic.otf') format('opentype');
          font-weight: normal;
          font-style: italic;
          font-display: swap;
        }

        @font-face {
          font-family: 'Bembo Book';
          src: url('/fonts/BemboBookMTStd-Bold.otf') format('opentype');
          font-weight: bold;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Bembo Book';
          src: url('/fonts/BemboBookMTStd-BoldIt.otf') format('opentype');
          font-weight: bold;
          font-style: italic;
          font-display: swap;
        }

        .font-serif {
          font-family: 'Bembo Book', serif;
        }

        .ticket-counter {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Gill Sans', sans-serif;
        }

        .counter-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid black;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          line-height: 1;
        }

        .counter-btn:hover {
          background: #fde68a;
          border-color: #b45309;
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.5);
        }

        .quantity-display {
          min-width: 1rem;
          text-align: center;
          font-weight: 600;
        }

        .wooden-sign {
          background-image: url('/wood4.jpg');
          background-size: cover;
          border: 8px solid #5d4037;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), inset 0 0 60px rgba(0, 0, 0, 0.2);
          position: relative;
          margin: 0 auto;
          margin-bottom: 2rem;
        }
        
        .section-sign {
          max-width: 400px;
          border-width: 6px;
          transform-origin: center;
          transition: transform 0.3s ease;
        }
        
        .section-sign.tickets-sign {
          transform: rotate(-2deg) translateY(2px);
        }
        
        .section-sign.special-sign {
          transform: rotate(1.5deg) translateY(-3px);
        }
        
        .section-sign.day-passes-sign {
          transform: rotate(-1deg) translateY(1px);
        }
        
        .wooden-sign::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.1);
          pointer-events: none;
        }
        
        .carved-text {
          color: rgba(255, 255, 240, 0.9);
          text-shadow: 
            0px 2px 3px rgba(0, 0, 0, 0.7),
            0px -2px 1px rgba(255, 255, 255, 0.2);
          font-weight: bold;
          letter-spacing: 1px;
          position: relative;
          margin: 0;
        }
        
        .carved-text::before {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          z-index: -1;
          color: rgba(0, 0, 0, 0.3);
        }
        
        .nail-top-left, .nail-top-right, .nail-bottom-left, .nail-bottom-right {
          position: absolute;
          width: 12px;
          height: 12px;
          background: #a0a0a0;
          border-radius: 50%;
          box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.6);
          border: 1px solid #707070;
        }
        
        .nail-top-left {
          top: 10px;
          left: 10px;
        }
        
        .nail-top-right {
          top: 10px;
          right: 10px;
        }
        
        .nail-bottom-left {
          bottom: 10px;
          left: 10px;
        }
        
        .nail-bottom-right {
          bottom: 10px;
          right: 10px;
        }
        
        .price-banner {
          background-color: #b22222;
          background-image: 
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.05), rgba(0,0,0,0.05));
          background-size: 10px 10px, 10px 10px, 100% 100%;
          color: white;
          padding: 6px;
          transform: rotate(-2deg);
          position: absolute;
          bottom: clamp(-3.5rem, -2.5rem - 2vw, -2.5rem);
          right: -1.5rem;
          width: 60%;
          z-index: 10;
          border-radius: 2px;
          border: 2px solid rgba(120, 30, 20, 0.8);
          border-left: 6px solid rgba(120, 30, 20, 0.8);
          border-right: 6px solid rgba(120, 30, 20, 0.8);
          box-shadow: 
            0 4px 6px rgba(0, 0, 0, 0.3),
            inset 0 0 15px rgba(0, 0, 0, 0.2);
          text-align: center;
          font-weight: bold;
          font-size: clamp(1.8rem, 5vw, 3rem);
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        }
        
        .price-banner::before, .price-banner::after {
          content: "";
          position: absolute;
          background: #781e14;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          top: 10px;
          border: 1px solid rgba(0,0,0,0.3);
        }
        
        .price-banner::before {
          left: 10px;
        }
        
        .price-banner::after {
          right: 10px;
        }
      `}</style>

      <Suspense fallback={null}>
        <SuccessMessage />
      </Suspense>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-[84px]">
        <div className="text-center mb-12">
          <div className="wooden-sign mx-auto !mb-20 py-8 px-6 rounded-lg relative">
            <div className="price-banner">Prices Go Up April 1st</div>
            <div className="nail-top-left"></div>
            <div className="nail-top-right"></div>
            <div className="nail-bottom-left"></div>
            <div className="nail-bottom-right"></div>
            <h1 className="carved-text text-5xl md:text-7xl [font-variant:small-caps] text-center">
              Ye olde Lighthaven Festival Season Ticket Store
            </h1>
          </div>
        </div>

        {/* Calendar Visualization */}
        <div className="mb-12 mx-auto overflow-x-auto hidden lg:block">
          <div className="min-w-[800px]">
            {/* Calendar Header */}
            <div className="grid grid-cols-10 border-b-2 border-gray-900">
              <div className="p-2 text-center border-r-2 border-gray-900 font-semibold">
                <div className="text-lg">Fri</div>
                <div>May 30</div>
              </div>
              <div className="p-2 text-center border-r-2 border-gray-900 font-semibold">
                <div className="text-lg">Sat</div>
                <div>May 31</div>
              </div>
              <div className="p-2 text-center border-r-2 border-gray-900 font-semibold">
                <div className="text-lg">Sun</div>
                <div>Jun 1</div>
              </div>
              <div className="p-2 text-center border-r-2 border-gray-900 font-semibold">
                <div className="text-lg">Mon</div>
                <div>Jun 2</div>
              </div>
              <div className="p-2 text-center border-r-2 border-gray-900 font-semibold">
                <div className="text-lg">Tue</div>
                <div>Jun 3</div>
              </div>
              <div className="p-2 text-center border-r-2 border-gray-900 font-semibold">
                <div className="text-lg">Wed</div>
                <div>Jun 4</div>
              </div>
              <div className="p-2 text-center border-r-2 border-gray-900 font-semibold">
                <div className="text-lg">Thu</div>
                <div>Jun 5</div>
              </div>
              <div className="p-2 text-center border-r-2 border-gray-900 font-semibold">
                <div className="text-lg">Fri</div>
                <div>Jun 6</div>
              </div>
              <div className="p-2 text-center border-r-2 border-gray-900 font-semibold">
                <div className="text-lg">Sat</div>
                <div>Jun 7</div>
              </div>
              <div className="p-2 text-center font-semibold">
                <div className="text-lg">Sun</div>
                <div>Jun 8</div>
              </div>
            </div>
            
            {/* Calendar Body */}
            <div className="h-24 relative">
              {/* LessOnline */}
              <a href="https://less.online" target="_blank" rel="noopener noreferrer" className="block cursor-pointer hover:bg-black/60 hover:text-white transition-colors duration-300 absolute left-0 w-[30%] h-full bg-white/20 flex items-center justify-center text-lg font-semibold border-gray-900">
                LessOnline
                <div className="absolute left-0 top-0 w-[33.33%] h-full">
                  <div className="w-full h-full bg-black" style={{clipPath: "polygon(0 100%, 0 0, 100% 0)"}}></div>
                </div>
              </a>
              
              {/* Summer Camp */}
              <a href="https://summercampcomingsoon.com/" target="_blank" rel="noopener noreferrer" className="block cursor-pointer hover:bg-black/60 hover:text-white transition-colors duration-300 absolute left-[30%] w-[50%] h-full bg-amber-400/40 flex items-center justify-center text-lg font-semibold">
                Mystery Summer Camp
              </a>
              
              {/* Manifest */}
              <a href="https://manifest.is" target="_blank" rel="noopener noreferrer" className="group block cursor-pointer hover:bg-black/60 hover:text-white transition-colors duration-300 absolute right-[0.1px] w-[20%] h-full bg-[#ee7644] flex items-center justify-center text-lg font-semibold">
                <div className="absolute left-[-50%] top-0 w-[50%] h-full">
                  <div className="w-full h-full bg-[#ee7644] group-hover:bg-black/60 transition-colors duration-300" style={{clipPath: "polygon(0 100%, 100% 0, 100% 100%)"}}></div>
                </div>
                Manifest
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Calendar Visualization */}
        <div className="mb-12 max-w-4xl mx-auto lg:hidden">
          <div className="space-y-4">
            {/* LessOnline */}
            <div className="bg-[#f8f3e2] p-4 rounded-lg border-2 border-gray-900">
              <div className="flex items-center justify-between gap-8">
                <h3 className="text-lg font-semibold">LessOnline</h3>
                <p className="text-lg text-gray-600">Fri, May 30 - Sun, Jun 1</p>
              </div>
            </div>
            
            {/* Summer Camp */}
            <div className="bg-[#f4b942] p-4 rounded-lg border-2 border-gray-900">
              <div className="flex items-center justify-between gap-8">
                <h3 className="text-lg font-semibold">Summer Camp</h3>
                <p className="text-lg text-gray-600">Mon, Jun 2 - Fri, Jun 6</p>
              </div>
            </div>
            
            {/* Manifest */}
            <div className="bg-[#7dd3fc] p-4 rounded-lg border-2 border-gray-900">
              <div className="flex items-center justify-between gap-8">
                <h3 className="text-lg font-semibold">Manifest</h3>
                <p className="text-lg text-gray-600">Fri, Jun 6 - Sun, Jun 8</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Grid Component */}
        <TicketGrid
          prices={prices}
          ticketQuantities={ticketQuantities}
          onQuantityChange={handleQuantityChange}
          showMoreSpecialTickets={showMoreSpecialTickets}
          setShowMoreSpecialTickets={setShowMoreSpecialTickets}
        />

        {/* Attendee Forms and Checkout Section */}
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Attendee Form Section Component */}
            <AttendeeFormSection
              attendee={attendee}
              handleAttendeeChange={handleAttendeeChange}
              handleDietaryPreferenceChange={handleDietaryPreferenceChange}
              showDietaryOther={showDietaryOther}
              hasLessOnlineTickets={checkHasEventTickets(ticketQuantities, 'lessonline')}
              hasManifestTickets={checkHasEventTickets(ticketQuantities, 'manifest')}
            />

            {/* Price Summary Section Component */}
            <PriceSummarySection
              totalAmount={totalAmount}
              appliedKarmaDiscount={appliedKarmaDiscount}
              appliedManaDiscount={appliedManaDiscount}
              showKarmaDiscount={showKarmaDiscount}
              showManaDiscount={showManaDiscount}
              karmaUsername={karmaUsername}
              karmaPoints={karmaPoints}
              manifoldUsername={manifoldUsername}
              setShowKarmaDiscount={setShowKarmaDiscount}
              setShowManaDiscount={setShowManaDiscount}
              setKarmaUsername={setKarmaUsername}
              setKarmaPoints={setKarmaPoints}
              setManifoldUsername={setManifoldUsername}
              handleApplyKarmaDiscount={handleApplyKarmaDiscount}
              handleApplyManaDiscount={handleApplyManaDiscount}
              handleCheckout={handleCheckout}
              isCheckoutEnabled={isCheckoutEnabled}
              hasTicketsSelected={hasTicketsSelected}
              getSelectionSummaryItems={getSelectionSummaryItems}
            />
          </div>
        </div>
      </div>

      {/* Fixed Price Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/60 backdrop-blur-sm shadow-lg z-50 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="text-lg text-gray-900">Tickets: <span className="font-bold">{totalTickets}</span></span>
              <span className="text-lg text-gray-900">Total: <span className="font-bold">${totalAmount.toFixed(2)}</span></span>
            </div>
            <div className="flex items-center gap-3">
              {hasTicketsSelected && !isCheckoutEnabled() && (
                <span className="text-amber-700 font-medium animate-pulse">Enter Info ↓</span>
              )}
              <button 
                onClick={handleCheckout}
                className="cursor-pointer border-2 border-black py-2 px-4 rounded-lg font-semibold hover:bg-black/90 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-32"
                disabled={!isCheckoutEnabled()}
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}