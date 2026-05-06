const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Clean all existing travel packages and their related data
async function cleanAll() {
  await prisma.packageAddOn.deleteMany();
  await prisma.packageInclusion.deleteMany();
  await prisma.packageDeparture.deleteMany();
  await prisma.packagePricingOption.deleteMany();
  await prisma.packageItinerary.deleteMany();
  await prisma.packageInterest.deleteMany();
  await prisma.travelPackage.deleteMany();
}

async function createPackage(data) {
  const {
    title, destination, durationDays, price, description, bannerImage, category,
    itineraries = [], pricingOptions = [], departures = [], inclusions = [], addOns = [],
  } = data;

  const pkg = await prisma.travelPackage.create({
    data: {
      title,
      destination,
      durationDays,
      price,
      description,
      bannerImage,
      category,
      isActive: true,
      featuredRank: data.featuredRank ?? null,
    },
  });

  // Create itineraries
  for (const it of itineraries) {
    await prisma.packageItinerary.create({
      data: {
        packageId: pkg.id,
        dayNumber: it.dayNumber,
        title: it.title,
        description: it.description || '',
        locations: JSON.stringify(it.locations || []),
        activities: JSON.stringify(it.activities || []),
        morningActivity: it.morningActivity || '',
        afternoonActivity: it.afternoonActivity || '',
        eveningActivity: it.eveningActivity || '',
        nightActivity: it.nightActivity || '',
      },
    });
  }

  // Create pricing options
  for (const opt of pricingOptions) {
    await prisma.packagePricingOption.create({
      data: { packageId: pkg.id, roomType: opt.roomType, price: opt.price },
    });
  }

  // Create departures
  for (const dep of departures) {
    await prisma.packageDeparture.create({
      data: {
        packageId: pkg.id,
        departureDate: new Date(dep.departureDate),
        availableSeats: dep.availableSeats,
        bookedSeats: dep.bookedSeats || 0,
        price: dep.price || price,
        isActive: true,
      },
    });
  }

  // Create inclusions
  for (const inc of inclusions) {
    await prisma.packageInclusion.create({
      data: { packageId: pkg.id, type: inc.type, description: inc.description },
    });
  }

  // Create add-ons
  for (const addon of addOns) {
    await prisma.packageAddOn.create({
      data: { packageId: pkg.id, title: addon.title, price: addon.price },
    });
  }

  return pkg;
}

// ─── Package definition helpers ───

function makePricing(options) {
  return options;
}

function makeDepartures(dates, basePrice) {
  return dates.map((d) => ({
    departureDate: d.date,
    availableSeats: d.seats || 20,
    bookedSeats: d.booked || 0,
    price: d.price || basePrice,
  }));
}

const DEFAULT_INCLUSIONS = [
  { type: 'inclusion', description: 'All transportation by AC Volvo/Tempo Traveller' },
  { type: 'inclusion', description: 'Hotel accommodation on sharing basis' },
  { type: 'inclusion', description: 'Daily breakfast and dinner' },
  { type: 'inclusion', description: 'All toll, parking, and driver allowances' },
  { type: 'inclusion', description: 'Professional tour guide' },
  { type: 'inclusion', description: 'All applicable taxes (GST included)' },
];

const DEFAULT_EXCLUSIONS = [
  { type: 'exclusion', description: 'Flight/Train tickets to the starting point' },
  { type: 'exclusion', description: 'Personal expenses (laundry, phone calls, tips)' },
  { type: 'exclusion', description: 'Entry fees to monuments and attractions' },
  { type: 'exclusion', description: 'Travel insurance' },
  { type: 'exclusion', description: 'Anything not mentioned in inclusions' },
];

function makeInclusions(extraInc = [], extraExc = []) {
  return [...DEFAULT_INCLUSIONS, ...extraInc, ...DEFAULT_EXCLUSIONS, ...extraExc];
}

// ─── 10 Destinations × multiple packages = 25+ total ───

const packages = [
  // ────────── GOA (3 packages) ──────────
  {
    title: 'Goa Beach Paradise',
    destination: 'Goa',
    durationDays: 4,
    price: 8999,
    description:
      'Experience the sun, sand, and sea of Goa. Visit North Goa beaches (Baga, Calangute, Anjuna), explore Fort Aguada, enjoy water sports, and unwind at beach shacks with live music.',
    bannerImage: '/images/packages/goa-beach-paradise.jpg',
    category: 'weekend_trips',
    featuredRank: 1,
    itineraries: [
      {
        dayNumber: 1, title: 'Arrival in Goa',
        morningActivity: 'Arrive at Goa airport/railway station, transfer to hotel',
        afternoonActivity: 'Lunch at a beach shack, check-in and freshen up',
        eveningActivity: 'Visit Baga Beach, enjoy sunset views',
        nightActivity: 'Dinner at a beachside restaurant with live music',
        locations: ['Goa Airport', 'Baga Beach'],
        activities: ['Hotel check-in', 'Beach visit', 'Sunset photography'],
      },
      {
        dayNumber: 2, title: 'North Goa Exploration',
        morningActivity: 'Visit Fort Aguada, enjoy panoramic views',
        afternoonActivity: 'Water sports at Calangute Beach (parasailing, jet ski)',
        eveningActivity: 'Explore Anjuna Flea Market',
        nightActivity: 'Beach party at Anjuna',
        locations: ['Fort Aguada', 'Calangute Beach', 'Anjuna'],
        activities: ['Sightseeing', 'Water sports', 'Flea market shopping'],
      },
      {
        dayNumber: 3, title: 'South Goa Heritage',
        morningActivity: 'Visit Basilica of Bom Jesus (UNESCO site)',
        afternoonActivity: 'Explore Old Goa churches and temples, lunch at a Goan restaurant',
        eveningActivity: 'Sunset cruise on Mandovi River',
        nightActivity: 'Casino night or dinner at Panjim',
        locations: ['Old Goa', 'Mandovi River', 'Panjim'],
        activities: ['Heritage tour', 'River cruise', 'Casino/Dinner'],
      },
      {
        dayNumber: 4, title: 'Departure',
        morningActivity: 'Morning walk at Colva Beach',
        afternoonActivity: 'Last-minute shopping, transfer to airport/station',
        eveningActivity: '',
        nightActivity: '',
        locations: ['Colva Beach'],
        activities: ['Beach walk', 'Shopping', 'Departure'],
      },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 8999 }, { roomType: 'triple', price: 10499 }, { roomType: 'double', price: 11999 }, { roomType: 'single', price: 15999 }]),
    departures: makeDepartures([
      { date: '2026-06-05', seats: 15 }, { date: '2026-06-19', seats: 20 }, { date: '2026-07-03', seats: 10, booked: 10 },
    ], 8999),
    inclusions: makeInclusions(),
    addOns: [
      { title: 'Scuba Diving', price: 3499 },
      { title: 'Dolphin Watching Cruise', price: 1499 },
      { title: 'Goan Cooking Class', price: 999 },
    ],
  },
  {
    title: 'Goa Weekend Getaway',
    destination: 'Goa',
    durationDays: 3,
    price: 5999,
    description:
      'A quick escape to Goa for the weekend. Enjoy the best beaches, party vibes, and delicious seafood. Perfect for a refreshing break from city life.',
    bannerImage: '/images/packages/goa-weekend-getaway.jpg',
    category: 'weekend_trips',
    featuredRank: 2,
    itineraries: [
      {
        dayNumber: 1, title: 'Arrival & Beach Fun',
        morningActivity: 'Arrive in Goa, transfer to hotel',
        afternoonActivity: 'Lunch and beach time at Calangute',
        eveningActivity: 'Sunset at Vagator Beach, explore nearby cafes',
        nightActivity: 'Dinner at a beach shack',
        locations: ['Calangute Beach', 'Vagator Beach'],
        activities: ['Beach time', 'Sunset viewing'],
      },
      {
        dayNumber: 2, title: 'Adventure & Nightlife',
        morningActivity: 'Water sports at Baga Beach',
        afternoonActivity: 'Shopping at Anjuna Flea Market',
        eveningActivity: 'Boat cruise on Mandovi River',
        nightActivity: 'Tito\'s Lane nightlife',
        locations: ['Baga Beach', 'Anjuna', 'Mandovi River'],
        activities: ['Water sports', 'Shopping', 'River cruise', 'Nightlife'],
      },
      {
        dayNumber: 3, title: 'Relax & Depart',
        morningActivity: 'Beach yoga session',
        afternoonActivity: 'Brunch, transfer to airport/station',
        eveningActivity: '',
        nightActivity: '',
        locations: ['Goa Airport'],
        activities: ['Yoga', 'Brunch', 'Departure'],
      },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 5999 }, { roomType: 'double', price: 7999 }, { roomType: 'single', price: 10999 }]),
    departures: makeDepartures([{ date: '2026-06-12', seats: 20 }, { date: '2026-06-26', seats: 18 }], 5999),
    inclusions: makeInclusions(),
    addOns: [{ title: 'Water Sports Combo', price: 2499 }, { title: 'Casino Entry', price: 1999 }],
  },
  {
    title: 'Goa Extended Luxury',
    destination: 'Goa',
    durationDays: 6,
    price: 19999,
    description:
      'A luxury Goa experience with 5-star beach resorts, private yacht cruise, spa treatments, and fine dining. Experience Goa like never before.',
    bannerImage: '/images/packages/goa-extended-luxury.jpg',
    category: 'group_tours',
    featuredRank: 3,
    itineraries: [
      {
        dayNumber: 1, title: 'Luxury Arrival',
        morningActivity: 'Airport pickup in a luxury sedan',
        afternoonActivity: 'Check-in at a 5-star beach resort',
        eveningActivity: 'Welcome cocktail by the pool',
        nightActivity: 'Gourmet dinner at the resort',
        locations: ['Goa Airport', '5-Star Resort'],
        activities: ['Resort check-in', 'Pool time', 'Fine dining'],
      },
      {
        dayNumber: 2, title: 'North Goa in Style',
        morningActivity: 'Private guided tour of Fort Aguada',
        afternoonActivity: 'Water sports at a private beach',
        eveningActivity: 'Sunset photography at Chapora Fort',
        nightActivity: 'Dinner at a Michelin-star restaurant',
        locations: ['Fort Aguada', 'Chapora Fort'],
        activities: ['Guided tour', 'Water sports', 'Fine dining'],
      },
      {
        dayNumber: 3, title: 'Private Yacht Day',
        morningActivity: 'Morning spa session at the resort',
        afternoonActivity: 'Private yacht cruise with lunch onboard',
        eveningActivity: 'Dolphin spotting, return at sunset',
        nightActivity: 'Beachside BBQ dinner',
        locations: ['Arabian Sea', 'Grande Island'],
        activities: ['Spa', 'Yacht cruise', 'Dolphin spotting', 'BBQ dinner'],
      },
      {
        dayNumber: 4, title: 'South Goa Exploration',
        morningActivity: 'Visit Cabo de Rama fort',
        afternoonActivity: 'Lunch at a heritage Portuguese villa',
        eveningActivity: 'Explore Palolem Beach',
        nightActivity: 'Silent disco at Palolem',
        locations: ['Cabo de Rama', 'Palolem Beach'],
        activities: ['Fort visit', 'Heritage lunch', 'Silent disco'],
      },
      {
        dayNumber: 5, title: 'Wellness & Culture',
        morningActivity: 'Yoga and meditation on the beach',
        afternoonActivity: 'Goan cooking class with a local chef',
        eveningActivity: 'Feni tasting session',
        nightActivity: 'Farewell dinner with live Fado music',
        locations: ['Resort Beach', 'Local Village'],
        activities: ['Yoga', 'Cooking class', 'Feni tasting', 'Live music'],
      },
      {
        dayNumber: 6, title: 'Departure Day',
        morningActivity: 'Leisurely breakfast, swim in the pool',
        afternoonActivity: 'Check-out, transfer to airport',
        eveningActivity: '',
        nightActivity: '',
        locations: ['Goa Airport'],
        activities: ['Resort time', 'Departure'],
      },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 19999 }, { roomType: 'double', price: 24999 }, { roomType: 'single', price: 32999 }]),
    departures: makeDepartures([{ date: '2026-07-10', seats: 8 }, { date: '2026-08-01', seats: 6 }], 19999),
    inclusions: makeInclusions([{ type: 'inclusion', description: '5-star beach resort accommodation' }, { type: 'inclusion', description: 'Private yacht cruise with lunch' }]),
    addOns: [{ title: 'Couple Spa Package', price: 4999 }, { title: 'Scuba Diving', price: 3999 }, { title: 'Helicopter Ride', price: 8999 }],
  },

  // ────────── MANALI (3 packages) ──────────
  {
    title: 'Manali Snow Adventure',
    destination: 'Manali',
    durationDays: 5,
    price: 10999,
    description:
      'Experience the magic of Manali with snow-capped peaks, Solang Valley adventures, Old Manali charm, and Rohtang Pass. Perfect for couples and families.',
    bannerImage: '/images/packages/manali-snow-adventure.jpg',
    category: 'group_tours',
    featuredRank: 4,
    itineraries: [
      {
        dayNumber: 1, title: 'Delhi to Manali (Overnight)',
        morningActivity: 'Depart from Delhi by AC Volvo in the evening',
        afternoonActivity: '',
        eveningActivity: 'Overnight journey through scenic routes',
        nightActivity: 'Travel overnight, arrive next morning',
        locations: ['Delhi ISBT'],
        activities: ['Overnight bus journey'],
      },
      {
        dayNumber: 2, title: 'Manali Arrival',
        morningActivity: 'Arrive in Manali, check into hotel',
        afternoonActivity: 'Visit Hadimba Temple and Club House',
        eveningActivity: 'Stroll on Mall Road, shop for souvenirs',
        nightActivity: 'Dinner at a local dhaba',
        locations: ['Manali Mall Road', 'Hadimba Temple'],
        activities: ['Hotel check-in', 'Temple visit', 'Shopping'],
      },
      {
        dayNumber: 3, title: 'Solang Valley',
        morningActivity: 'Head to Solang Valley for adventure sports',
        afternoonActivity: 'Paragliding, zorbing, skiing (seasonal), lunch at valley',
        eveningActivity: 'Return to Manali, explore Old Manali',
        nightActivity: 'Bonfire with music at the hotel',
        locations: ['Solang Valley', 'Old Manali'],
        activities: ['Paragliding', 'Zorbing', 'Skiing', 'Bonfire'],
      },
      {
        dayNumber: 4, title: 'Rohtang Pass',
        morningActivity: 'Early departure to Rohtang Pass (subject to permit)',
        afternoonActivity: 'Play in snow, photography, lunch at Marhi',
        eveningActivity: 'Return to Manali, relax',
        nightActivity: 'Farewell dinner at a riverside cafe',
        locations: ['Rohtang Pass', 'Marhi'],
        activities: ['Snow activities', 'Photography', 'Farewell dinner'],
      },
      {
        dayNumber: 5, title: 'Return Journey',
        morningActivity: 'After breakfast, check out',
        afternoonActivity: 'Depart for Delhi in AC Volvo',
        eveningActivity: '',
        nightActivity: 'Overnight journey',
        locations: ['Manali Bus Stand'],
        activities: ['Checkout', 'Departure'],
      },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 10999 }, { roomType: 'triple', price: 12499 }, { roomType: 'double', price: 13999 }, { roomType: 'single', price: 17999 }]),
    departures: makeDepartures([{ date: '2026-06-08', seats: 25 }, { date: '2026-06-22', seats: 15 }, { date: '2026-07-06', seats: 30 }], 10999),
    inclusions: makeInclusions(),
    addOns: [{ title: 'River Rafting', price: 1499 }, { title: 'Camping at Solang', price: 2999 }, { title: 'Helicopter Ride', price: 4999 }],
  },
  {
    title: 'Manali Weekend Escape',
    destination: 'Manali',
    durationDays: 3,
    price: 7499,
    description: 'A quick escape to the hills. Visit Manali for a refreshing weekend with scenic beauty and cool mountain air.',
    bannerImage: '/images/packages/manali-weekend-escape.jpg',
    category: 'weekend_trips',
    featuredRank: 5,
    itineraries: [
      { dayNumber: 1, title: 'Arrival & Mall Road', morningActivity: 'Arrive in Manali, check in', afternoonActivity: 'Visit Hadimba Temple and Vashisht Hot Springs', eveningActivity: 'Mall Road exploration', nightActivity: 'Dinner at a local cafe', locations: ['Manali'], activities: ['Temple visit', 'Shopping'] },
      { dayNumber: 2, title: 'Solang Adventure', morningActivity: 'Solang Valley adventure sports', afternoonActivity: 'Paragliding and snow play', eveningActivity: 'Return and relax', nightActivity: 'Bonfire dinner', locations: ['Solang Valley'], activities: ['Adventure sports', 'Bonfire'] },
      { dayNumber: 3, title: 'Departure', morningActivity: 'Breakfast and check out', afternoonActivity: 'Depart to Delhi', eveningActivity: '', nightActivity: '', locations: [], activities: ['Departure'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 7499 }, { roomType: 'double', price: 9499 }]),
    departures: makeDepartures([{ date: '2026-06-13', seats: 20 }, { date: '2026-06-27', seats: 18 }], 7499),
    inclusions: makeInclusions(),
    addOns: [{ title: 'Paragliding', price: 1999 }, { title: 'Snow Scooter', price: 999 }],
  },
  {
    title: 'Manali Kasol Kheerganga Trek',
    destination: 'Manali',
    durationDays: 8,
    price: 15999,
    description: 'An epic Himalayan adventure covering Manali, Kasol, and the Kheerganga trek. Experience hot springs, Israeli culture, and stunning mountain trails.',
    bannerImage: '/images/packages/manali-kasol-kheerganga.jpg',
    category: 'group_tours',
    itineraries: [
      { dayNumber: 1, title: 'Delhi to Manali', morningActivity: '', afternoonActivity: '', eveningActivity: 'Depart from Delhi by AC Volvo', nightActivity: 'Overnight journey', locations: ['Delhi'], activities: ['Overnight travel'] },
      { dayNumber: 2, title: 'Manali Day', morningActivity: 'Arrive, check-in at hotel', afternoonActivity: 'Visit Hadimba Temple, Old Manali', eveningActivity: 'Mall Road walk', nightActivity: 'Dinner at Cafe 1947', locations: ['Manali'], activities: ['Sightseeing'] },
      { dayNumber: 3, title: 'Solang Valley', morningActivity: 'Solang Valley adventure', afternoonActivity: 'Zipline, rappelling, ATV ride', eveningActivity: 'Return to Manali', nightActivity: 'Bonfire', locations: ['Solang Valley'], activities: ['Adventure sports'] },
      { dayNumber: 4, title: 'Manali to Kasol', morningActivity: 'Drive to Kasol via Kullu', afternoonActivity: 'Check into riverside camp, explore cafes', eveningActivity: 'Israeli food experience', nightActivity: 'Campfire by Parvati river', locations: ['Kullu', 'Kasol'], activities: ['Scenic drive', 'Cafe hopping'] },
      { dayNumber: 5, title: 'Kasol to Barshaini', morningActivity: 'Drive to Barshaini (trek start point)', afternoonActivity: 'Begin Kheerganga trek', eveningActivity: 'Arrive at Kheerganga top, hot spring bath', nightActivity: 'Camp under the stars', locations: ['Barshaini', 'Kheerganga'], activities: ['Trekking', 'Hot springs'] },
      { dayNumber: 6, title: 'Kheerganga to Kasol', morningActivity: 'Sunrise over Himalayas, breakfast', afternoonActivity: 'Descend to Barshaini, drive back to Kasol', eveningActivity: 'Relax by the river', nightActivity: 'Farewell dinner', locations: ['Kheerganga', 'Kasol'], activities: ['Trek descent', 'Relaxation'] },
      { dayNumber: 7, title: 'Manali Free Day', morningActivity: 'Drive back to Manali', afternoonActivity: 'Free time - optional river rafting', eveningActivity: 'Last shopping at Mall Road', nightActivity: 'Dinner', locations: ['Manali'], activities: ['Free day', 'Shopping'] },
      { dayNumber: 8, title: 'Return to Delhi', morningActivity: 'Check out, depart', afternoonActivity: '', eveningActivity: '', nightActivity: 'Overnight journey', locations: ['Delhi'], activities: ['Departure'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 15999 }, { roomType: 'triple', price: 17999 }, { roomType: 'double', price: 19999 }]),
    departures: makeDepartures([{ date: '2026-06-15', seats: 12 }, { date: '2026-07-05', seats: 15 }], 15999),
    inclusions: makeInclusions([{ type: 'inclusion', description: 'Camping equipment at Kheerganga' }, { type: 'inclusion', description: 'Trek guide' }]),
    addOns: [{ title: 'River Rafting (Kullu)', price: 1999 }, { title: 'Trekking Pole Rental', price: 299 }],
  },

  // ────────── SHIMLA (2 packages) ──────────
  {
    title: 'Shimla Heritage Trail',
    destination: 'Shimla',
    durationDays: 4,
    price: 8999,
    description: 'Explore the Queen of Hills - Shimla. Walk the historic Mall Road, visit Jakhoo Temple, ride the Kalka-Shimla toy train, and experience colonial charm.',
    bannerImage: '/images/packages/shimla-heritage-trail.jpg',
    category: 'family_tours',
    featuredRank: 6,
    itineraries: [
      { dayNumber: 1, title: 'Arrival', morningActivity: 'Arrive in Shimla, hotel check-in', afternoonActivity: 'Lunch, relaxed walk on Mall Road', eveningActivity: 'Visit The Ridge and Christ Church', nightActivity: 'Dinner at a colonial-era restaurant', locations: ['Shimla Mall Road', 'The Ridge'], activities: ['Heritage walk'] },
      { dayNumber: 2, title: 'Kufri Excursion', morningActivity: 'Drive to Kufri', afternoonActivity: 'Horse riding, Himalayan Nature Park', eveningActivity: 'Return to Shimla, visit Jakhoo Temple', nightActivity: 'Dinner, local food tasting', locations: ['Kufri', 'Jakhoo Temple'], activities: ['Horse riding', 'Wildlife park'] },
      { dayNumber: 3, title: 'Toy Train & Mashobra', morningActivity: 'Kalka-Shimla Toy Train ride', afternoonActivity: 'Visit Mashobra, apple orchards', eveningActivity: 'Return to Shimla', nightActivity: 'Bonfire dinner', locations: ['Kalka', 'Mashobra'], activities: ['Toy train', 'Apple orchard visit'] },
      { dayNumber: 4, title: 'Departure', morningActivity: 'After breakfast, check out', afternoonActivity: 'Transfer to station', eveningActivity: '', nightActivity: '', locations: [], activities: ['Departure'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 8999 }, { roomType: 'triple', price: 10499 }, { roomType: 'double', price: 11999 }, { roomType: 'single', price: 15999 }]),
    departures: makeDepartures([{ date: '2026-06-10', seats: 20 }, { date: '2026-06-24', seats: 22 }], 8999),
    inclusions: makeInclusions([{ type: 'inclusion', description: 'Toy train ticket (Kalka-Shimla)' }]),
    addOns: [{ title: 'Kufri Adventure Park', price: 999 }, { title: 'Guided Heritage Walk', price: 499 }],
  },
  {
    title: 'Shimla Manali Combo',
    destination: 'Shimla',
    durationDays: 7,
    price: 17999,
    description: 'The ultimate Himachal experience covering both Shimla and Manali. Colonial charm meets mountain adventure in this 7-day journey.',
    bannerImage: '/images/packages/shimla-manali-combo.jpg',
    category: 'family_tours',
    itineraries: [
      { dayNumber: 1, title: 'Arrive Shimla', morningActivity: 'Arrive, hotel check-in', afternoonActivity: 'Mall Road and The Ridge', eveningActivity: 'Christ Church', nightActivity: 'Dinner at Ashiana', locations: ['Shimla'], activities: ['Heritage walk'] },
      { dayNumber: 2, title: 'Kufri & Toy Train', morningActivity: 'Kufri excursion', afternoonActivity: 'Toy train experience', eveningActivity: 'Lakkar Bazaar shopping', nightActivity: 'Free evening', locations: ['Kufri', 'Kalka'], activities: ['Sightseeing', 'Toy train'] },
      { dayNumber: 3, title: 'Shimla to Manali', morningActivity: 'Scenic drive to Manali (7 hrs)', afternoonActivity: 'En-route lunch at Mandi', eveningActivity: 'Arrive Manali, check-in', nightActivity: 'Rest', locations: ['Mandi', 'Manali'], activities: ['Scenic drive'] },
      { dayNumber: 4, title: 'Manali Local', morningActivity: 'Hadimba Temple, Club House', afternoonActivity: 'Old Manali cafes', eveningActivity: 'Vashisht Hot Springs', nightActivity: 'Dinner at Johnson\'s Cafe', locations: ['Manali'], activities: ['Temple visit', 'Hot springs'] },
      { dayNumber: 5, title: 'Solang Valley', morningActivity: 'Solang Valley adventure', afternoonActivity: 'Snow sports', eveningActivity: 'Return, explore Mall Road', nightActivity: 'Bonfire', locations: ['Solang Valley'], activities: ['Adventure sports'] },
      { dayNumber: 6, title: 'Rohtang Pass', morningActivity: 'Rohtang Pass excursion', afternoonActivity: 'Snow activities, photography', eveningActivity: 'Return to Manali', nightActivity: 'Farewell dinner', locations: ['Rohtang Pass'], activities: ['Snow activities'] },
      { dayNumber: 7, title: 'Departure', morningActivity: 'Check out', afternoonActivity: 'Depart for Delhi', eveningActivity: '', nightActivity: '', locations: [], activities: ['Departure'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 17999 }, { roomType: 'triple', price: 19999 }, { roomType: 'double', price: 22999 }]),
    departures: makeDepartures([{ date: '2026-06-10', seats: 20 }, { date: '2026-07-01', seats: 18 }], 17999),
    inclusions: makeInclusions([{ type: 'inclusion', description: 'Toy train ticket' }]),
    addOns: [{ title: 'River Rafting', price: 1499 }, { title: 'Paragliding', price: 2499 }],
  },

  // ────────── KEDARNATH (2 packages) ──────────
  {
    title: 'Kedarnath Dham Yatra',
    destination: 'Kedarnath',
    durationDays: 6,
    price: 11499,
    description: 'Sacred pilgrimage to Kedarnath Dham. Trek through the majestic Garhwal Himalayas to one of the 12 Jyotirlingas. Includes visit to Haridwar and Tungnath.',
    bannerImage: '/images/packages/kedarnath-dham-yatra.jpg',
    category: 'pilgrimage',
    featuredRank: 7,
    itineraries: [
      { dayNumber: 1, title: 'Haridwar Arrival', morningActivity: 'Arrive Haridwar, check-in', afternoonActivity: 'Visit Har Ki Pauri, take holy dip', eveningActivity: 'Ganga Aarti at Har Ki Pauri', nightActivity: 'Dinner at hotel', locations: ['Haridwar', 'Har Ki Pauri'], activities: ['Holy dip', 'Ganga Aarti'] },
      { dayNumber: 2, title: 'Haridwar to Gaurikund', morningActivity: 'Buffer day for travel or rest', afternoonActivity: 'Scenic drive to Gaurikund base', eveningActivity: 'Arrive Gaurikund, prepare for trek', nightActivity: 'Early dinner, rest for tomorrow', locations: ['Gaurikund'], activities: ['Travel day'] },
      { dayNumber: 3, title: 'Trek to Kedarnath', morningActivity: 'Early morning trek from Gaurikund (16 km)', afternoonActivity: 'Lunch en-route at Rambara', eveningActivity: 'Arrive Kedarnath, darshan at temple', nightActivity: 'Stay at GMVN guest house', locations: ['Gaurikund', 'Rambara', 'Kedarnath'], activities: ['Trekking', 'Darshan'] },
      { dayNumber: 4, title: 'Kedarnath to Gaurikund', morningActivity: 'Morning Aarti at Kedarnath temple', afternoonActivity: 'Trek back to Gaurikund', eveningActivity: 'Rest and dinner', nightActivity: 'Overnight stay', locations: ['Kedarnath', 'Gaurikund'], activities: ['Morning Aarti', 'Descent trek'] },
      { dayNumber: 5, title: 'Tungnath Temple', morningActivity: 'Drive to Chopta, trek to Tungnath (3.5 km)', afternoonActivity: 'Darshan at Tungnath, the highest Shiva temple', eveningActivity: 'Return to base, drive to Rishikesh', nightActivity: 'Overnight journey', locations: ['Chopta', 'Tungnath'], activities: ['Trek', 'Darshan'] },
      { dayNumber: 6, title: 'Return', morningActivity: 'Arrive Rishikesh, visit Laxman Jhula', afternoonActivity: 'Transfer to Haridwar station', eveningActivity: 'Depart for home', nightActivity: '', locations: ['Rishikesh', 'Haridwar'], activities: ['Sightseeing', 'Departure'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 11499 }, { roomType: 'triple', price: 12999 }, { roomType: 'double', price: 14999 }]),
    departures: makeDepartures([{ date: '2026-06-01', seats: 30 }, { date: '2026-06-20', seats: 25 }, { date: '2026-07-10', seats: 20 }], 11499),
    inclusions: makeInclusions([{ type: 'inclusion', description: 'GMVN guest house accommodation at Kedarnath' }, { type: 'inclusion', description: 'Experienced trek guide' }]),
    addOns: [{ title: 'Pony/Palki Ride', price: 2999 }, { title: 'Helicopter Ticket (one way)', price: 6999 }],
  },
  {
    title: 'Char Dham Yatra (Badri-Kedar)',
    destination: 'Kedarnath',
    durationDays: 10,
    price: 24999,
    description: 'Sacred pilgrimage covering Badrinath and Kedarnath. A spiritually enriching journey through the Garhwal Himalayas.',
    bannerImage: '/images/packages/char-dham-yatra.jpg',
    category: 'pilgrimage',
    itineraries: [
      { dayNumber: 1, title: 'Haridwar Arrival', morningActivity: 'Arrive, check-in', afternoonActivity: 'Har Ki Pauri', eveningActivity: 'Ganga Aarti', nightActivity: 'Dinner', locations: ['Haridwar'], activities: ['Aarti'] },
      { dayNumber: 2, title: 'Haridwar to Guptkashi', morningActivity: 'Scenic drive (8-9 hrs)', afternoonActivity: 'Lunch en-route', eveningActivity: 'Arrive Guptkashi', nightActivity: 'Rest', locations: ['Guptkashi'], activities: ['Scenic drive'] },
      { dayNumber: 3, title: 'Kedarnath Trek', morningActivity: 'Early trek from Gaurikund', afternoonActivity: 'Trek continues', eveningActivity: 'Arrive Kedarnath, darshan', nightActivity: 'GMVN stay', locations: ['Kedarnath'], activities: ['Trek', 'Darshan'] },
      { dayNumber: 4, title: 'Return from Kedarnath', morningActivity: 'Aarti, descend', afternoonActivity: 'Arrive Gaurikund', eveningActivity: 'Drive to Guptkashi', nightActivity: 'Rest', locations: ['Kedarnath', 'Guptkashi'], activities: ['Trek descent'] },
      { dayNumber: 5, title: 'Guptkashi to Badrinath', morningActivity: 'Drive to Badrinath', afternoonActivity: 'Check-in', eveningActivity: 'Visit Badrinath temple', nightActivity: 'Dinner', locations: ['Badrinath'], activities: ['Darshan'] },
      { dayNumber: 6, title: 'Badrinath Exploration', morningActivity: 'Morning Aarti, Tapt Kund', afternoonActivity: 'Visit Mana Village (last Indian village)', eveningActivity: 'Vyas Gufa, Bhim Pul', nightActivity: 'Rest', locations: ['Badrinath', 'Mana Village'], activities: ['Exploration'] },
      { dayNumber: 7, title: 'Badrinath to Joshimath', morningActivity: 'Depart for Joshimath', afternoonActivity: 'Visit Auli ropeway (optional)', eveningActivity: 'Narsingh Temple', nightActivity: 'Stay', locations: ['Joshimath', 'Auli'], activities: ['Ropeway'] },
      { dayNumber: 8, title: 'Joshimath to Rishikesh', morningActivity: 'Long drive to Rishikesh', afternoonActivity: 'Lunch on the way', eveningActivity: 'Arrive Rishikesh', nightActivity: 'Ganga Aarti at Triveni Ghat', locations: ['Rishikesh'], activities: ['Aarti'] },
      { dayNumber: 9, title: 'Rishikesh Day', morningActivity: 'River rafting at Shivpuri', afternoonActivity: 'Visit Beatles Ashram, Laxman Jhula', eveningActivity: 'Free time', nightActivity: 'Farewell dinner', locations: ['Rishikesh'], activities: ['Rafting', 'Ashram'] },
      { dayNumber: 10, title: 'Departure', morningActivity: 'Check out', afternoonActivity: 'Transfer to Haridwar station', eveningActivity: '', nightActivity: '', locations: ['Haridwar'], activities: ['Departure'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 24999 }, { roomType: 'double', price: 29999 }]),
    departures: makeDepartures([{ date: '2026-06-05', seats: 20 }, { date: '2026-07-01', seats: 15 }], 24999),
    inclusions: makeInclusions([{ type: 'inclusion', description: 'Pony/Palki at Kedarnath (optional)' }]),
    addOns: [{ title: 'Helicopter (Kedarnath)', price: 6999 }, { title: 'River Rafting', price: 1499 }],
  },

  // ────────── KASHMIR (3 packages) ──────────
  {
    title: 'Kashmir Paradise',
    destination: 'Kashmir',
    durationDays: 6,
    price: 18999,
    description: 'Heaven on Earth — experience Srinagar\'s Dal Lake, Gulmarg\'s meadows, Pahalgam\'s valleys, and Sonamarg\'s glaciers in one unforgettable trip.',
    bannerImage: '/images/packages/kashmir-paradise.jpg',
    category: 'group_tours',
    itineraries: [
      { dayNumber: 1, title: 'Arrive Srinagar', morningActivity: 'Arrive, transfer to houseboat', afternoonActivity: 'Shikara ride on Dal Lake', eveningActivity: 'Visit Mughal Gardens (Shalimar, Nishat)', nightActivity: 'Dinner at houseboat', locations: ['Srinagar', 'Dal Lake'], activities: ['Shikara ride', 'Mughal Gardens'] },
      { dayNumber: 2, title: 'Srinagar to Gulmarg', morningActivity: 'Drive to Gulmarg (2 hrs)', afternoonActivity: 'Gandola ride (Phase 1 & 2)', eveningActivity: 'Snow activities, meadow walk', nightActivity: 'Stay at Gulmarg', locations: ['Gulmarg'], activities: ['Gandola ride', 'Snow activities'] },
      { dayNumber: 3, title: 'Gulmarg to Pahalgam', morningActivity: 'Drive to Pahalgam (4 hrs)', afternoonActivity: 'Visit Betaab Valley', eveningActivity: 'Lidder River walk', nightActivity: 'Dinner at hotel', locations: ['Pahalgam', 'Betaab Valley'], activities: ['Valley visit', 'River walk'] },
      { dayNumber: 4, title: 'Pahalgam Exploration', morningActivity: 'Visit Aru Valley and Baisaran', afternoonActivity: 'Pony ride (optional)', eveningActivity: 'Shopping for Kashmiri handicrafts', nightActivity: 'Bonfire', locations: ['Aru Valley', 'Pahalgam'], activities: ['Valley exploration', 'Shopping'] },
      { dayNumber: 5, title: 'Sonamarg Day Trip', morningActivity: 'Drive to Sonamarg (3 hrs)', afternoonActivity: 'Visit Thajiwas Glacier, pony ride', eveningActivity: 'Return to Srinagar', nightActivity: 'Farewell dinner', locations: ['Sonamarg', 'Thajiwas Glacier'], activities: ['Glacier visit', 'Pony ride'] },
      { dayNumber: 6, title: 'Departure', morningActivity: 'Visit Shankaracharya Temple', afternoonActivity: 'Transfer to airport', eveningActivity: '', nightActivity: '', locations: ['Srinagar'], activities: ['Temple visit', 'Departure'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 18999 }, { roomType: 'triple', price: 20999 }, { roomType: 'double', price: 23999 }, { roomType: 'single', price: 29999 }]),
    departures: makeDepartures([{ date: '2026-06-07', seats: 20 }, { date: '2026-06-21', seats: 18 }, { date: '2026-07-05', seats: 25 }], 18999),
    inclusions: makeInclusions([{ type: 'inclusion', description: 'One night houseboat stay on Dal Lake' }, { type: 'inclusion', description: 'Gandola ride Phase 1' }]),
    addOns: [{ title: 'Gandola Phase 2', price: 999 }, { title: 'River Rafting (Pahalgam)', price: 1499 }, { title: 'Kashmiri Wazwan Dinner', price: 1299 }],
  },
  {
    title: 'Kashmir Winter Wonderland',
    destination: 'Kashmir',
    durationDays: 5,
    price: 15999,
    description: 'A winter wonderland experience with snow-covered landscapes, Gulmarg skiing, and cozy houseboat stays. Perfect for winter lovers.',
    bannerImage: '/images/packages/kashmir-winter-wonderland.jpg',
    category: 'group_tours',
    itineraries: [
      { dayNumber: 1, title: 'Srinagar Welcome', morningActivity: 'Arrive, houseboat check-in', afternoonActivity: 'Shikara ride in snowy Dal Lake', eveningActivity: 'Hot Kahwa and local snacks', nightActivity: 'Kangri-warmed dinner', locations: ['Srinagar', 'Dal Lake'], activities: ['Shikara ride', 'Kahwa'] },
      { dayNumber: 2, title: 'Gulmarg Skiing', morningActivity: 'Drive to Gulmarg', afternoonActivity: 'Skiing lessons and snowboarding', eveningActivity: 'Snow walk under moonlight', nightActivity: 'Stay at ski resort', locations: ['Gulmarg'], activities: ['Skiing', 'Snowboarding'] },
      { dayNumber: 3, title: 'Gulmarg to Pahalgam', morningActivity: 'More skiing or snow activities', afternoonActivity: 'Drive to Pahalgam', eveningActivity: 'Winter walk in Betaab Valley', nightActivity: 'Hot dinner at hotel', locations: ['Gulmarg', 'Pahalgam'], activities: ['Skiing', 'Valley walk'] },
      { dayNumber: 4, title: 'Pahalgam Snow', morningActivity: 'Snow trek to Aru Valley', afternoonActivity: 'Sledging and snowman building', eveningActivity: 'Return to Srinagar', nightActivity: 'Farewell dinner', locations: ['Aru Valley', 'Srinagar'], activities: ['Snow trek', 'Sledging'] },
      { dayNumber: 5, title: 'Departure', morningActivity: 'Visit Lal Chowk for shopping', afternoonActivity: 'Transfer to airport', eveningActivity: '', nightActivity: '', locations: ['Srinagar'], activities: ['Shopping', 'Departure'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 15999 }, { roomType: 'double', price: 19999 }]),
    departures: makeDepartures([{ date: '2026-11-15', seats: 15 }, { date: '2026-12-01', seats: 20 }], 15999),
    inclusions: makeInclusions([{ type: 'inclusion', description: 'Ski equipment rental' }]),
    addOns: [{ title: 'Ski Instructor', price: 2499 }, { title: 'Snowmobile Ride', price: 1999 }],
  },
  {
    title: 'Kashmir Grand Tour',
    destination: 'Kashmir',
    durationDays: 8,
    price: 27999,
    description: 'The ultimate Kashmir experience covering Srinagar, Gulmarg, Pahalgam, Sonamarg, and Doodhpathri. Includes a night in a luxury houseboat.',
    bannerImage: '/images/packages/kashmir-grand-tour.jpg',
    category: 'family_tours',
    itineraries: [
      { dayNumber: 1, title: 'Srinagar Arrival', morningActivity: 'Arrive, luxury houseboat', afternoonActivity: 'Shikara ride, floating market', eveningActivity: 'Mughal Gardens', nightActivity: 'Dinner on Dal Lake', locations: ['Srinagar'], activities: ['Luxury houseboat'] },
      { dayNumber: 2, title: 'Srinagar Local', morningActivity: 'Shankaracharya Temple, Pari Mahal', afternoonActivity: 'Hazratbal Shrine, Jamia Masjid', eveningActivity: 'Lal Chowk shopping', nightActivity: 'Kahwa tasting', locations: ['Srinagar'], activities: ['Temple visit', 'Shopping'] },
      { dayNumber: 3, title: 'Gulmarg', morningActivity: 'Drive to Gulmarg', afternoonActivity: 'Gandola ride, meadow golf', eveningActivity: 'Pony ride', nightActivity: 'Stay at Gulmarg', locations: ['Gulmarg'], activities: ['Gandola', 'Pony ride'] },
      { dayNumber: 4, title: 'Pahalgam', morningActivity: 'Drive via saffron fields', afternoonActivity: 'Betaab Valley, Aru Valley', eveningActivity: 'Lidder River walk', nightActivity: 'Bonfire', locations: ['Pahalgam'], activities: ['Valley exploration'] },
      { dayNumber: 5, title: 'Pahalgam Trek', morningActivity: 'Baisaran meadow trek', afternoonActivity: 'Picnic lunch, pony ride', eveningActivity: 'Shopping', nightActivity: 'Kashmiri Wazwan dinner', locations: ['Pahalgam'], activities: ['Trek', 'Food'] },
      { dayNumber: 6, title: 'Sonamarg', morningActivity: 'Drive to Sonamarg', afternoonActivity: 'Thajiwas Glacier trek', eveningActivity: 'Zero Point visit', nightActivity: 'Return to Srinagar', locations: ['Sonamarg'], activities: ['Glacier trek'] },
      { dayNumber: 7, title: 'Doodhpathri', morningActivity: 'Day trip to Doodhpathri', afternoonActivity: 'Meadow walks, horse ride', eveningActivity: 'Return to Srinagar', nightActivity: 'Farewell dinner', locations: ['Doodhpathri'], activities: ['Meadow exploration'] },
      { dayNumber: 8, title: 'Departure', morningActivity: 'Last-minute shopping', afternoonActivity: 'Airport transfer', eveningActivity: '', nightActivity: '', locations: ['Srinagar'], activities: ['Departure'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 27999 }, { roomType: 'double', price: 33999 }, { roomType: 'single', price: 42999 }]),
    departures: makeDepartures([{ date: '2026-06-10', seats: 12 }, { date: '2026-07-01', seats: 10 }], 27999),
    inclusions: makeInclusions([{ type: 'inclusion', description: 'Luxury houseboat with private deck' }, { type: 'inclusion', description: 'Gandola Phase 1 & 2 tickets' }]),
    addOns: [{ title: 'Photography Service', price: 3499 }, { title: 'Private Chef Dinner', price: 4999 }],
  },

  // ────────── RAJASTHAN (2 packages) ──────────
  {
    title: 'Royal Rajasthan',
    destination: 'Rajasthan',
    durationDays: 7,
    price: 22999,
    description: 'Experience the royal heritage of Rajasthan — Jaipur\'s forts, Udaipur\'s lakes, Jodhpur\'s Mehrangarh, and the golden sands of Jaisalmer.',
    bannerImage: '/images/packages/royal-rajasthan.jpg',
    category: 'family_tours',
    itineraries: [
      { dayNumber: 1, title: 'Arrive Jaipur', morningActivity: 'Arrive, hotel check-in', afternoonActivity: 'Visit City Palace and Jantar Mantar', eveningActivity: 'Hawa Mahal sunset view', nightActivity: 'Dinner at Chokhi Dhani', locations: ['Jaipur'], activities: ['Heritage tour', 'Cultural dinner'] },
      { dayNumber: 2, title: 'Jaipur Exploration', morningActivity: 'Amer Fort with elephant ride', afternoonActivity: 'Jaigarh Fort, Nahargarh Fort', eveningActivity: 'Shopping at Johari Bazaar', nightActivity: 'Free evening', locations: ['Jaipur'], activities: ['Fort visit', 'Shopping'] },
      { dayNumber: 3, title: 'Jaipur to Jodhpur', morningActivity: 'Drive to Jodhpur (5 hrs)', afternoonActivity: 'Mehrangarh Fort tour', eveningActivity: 'Blue City walk, Sardar Market', nightActivity: 'Dinner with Rajasthani folk music', locations: ['Jodhpur'], activities: ['Fort tour', 'Blue City walk'] },
      { dayNumber: 4, title: 'Jodhpur to Jaisalmer', morningActivity: 'Drive to Jaisalmer (5 hrs)', afternoonActivity: 'Check into desert camp', eveningActivity: 'Camel ride into dunes', nightActivity: 'Desert camping with bonfire', locations: ['Jaisalmer', 'Thar Desert'], activities: ['Camel ride', 'Desert camping'] },
      { dayNumber: 5, title: 'Jaisalmer Exploration', morningActivity: 'Jaisalmer Fort tour', afternoonActivity: 'Visit Patwon ki Haveli, Gadisar Lake', eveningActivity: 'Sunset at Sam Dunes', nightActivity: 'Rajasthani cultural night', locations: ['Jaisalmer'], activities: ['Fort tour', 'Dune sunset'] },
      { dayNumber: 6, title: 'Jaisalmer to Udaipur', morningActivity: 'Fly/drive to Udaipur', afternoonActivity: 'City Palace, Jag Mandir', eveningActivity: 'Boat ride on Lake Pichola', nightActivity: 'Dinner at rooftop restaurant', locations: ['Udaipur'], activities: ['Palace tour', 'Lake cruise'] },
      { dayNumber: 7, title: 'Udaipur & Departure', morningActivity: 'Visit Sahelion ki Bari, Fateh Sagar', afternoonActivity: 'Transfer to airport', eveningActivity: '', nightActivity: '', locations: ['Udaipur'], activities: ['Garden visit', 'Departure'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 22999 }, { roomType: 'triple', price: 24999 }, { roomType: 'double', price: 27999 }]),
    departures: makeDepartures([{ date: '2026-09-15', seats: 18 }, { date: '2026-10-01', seats: 20 }], 22999),
    inclusions: makeInclusions([{ type: 'inclusion', description: 'Desert camping with camel ride' }, { type: 'inclusion', description: 'Rajasthani cultural show' }]),
    addOns: [{ title: 'Elephant Ride (Amer)', price: 999 }, { title: 'Dune Bashing', price: 1499 }, { title: 'Heritage Hotel Upgrade', price: 5999 }],
  },
  {
    title: 'Jaipur Weekend Heritage',
    destination: 'Rajasthan',
    durationDays: 3,
    price: 7499,
    description: 'A quick heritage weekend in the Pink City. Explore Amer Fort, Hawa Mahal, City Palace, and enjoy authentic Rajasthani cuisine.',
    bannerImage: '/images/packages/jaipur-weekend-heritage.jpg',
    category: 'weekend_trips',
    itineraries: [
      { dayNumber: 1, title: 'Arrival & Old City', morningActivity: 'Arrive, check-in', afternoonActivity: 'City Palace and Jantar Mantar', eveningActivity: 'Hawa Mahal, shopping', nightActivity: 'Dinner at Chokhi Dhani', locations: ['Jaipur'], activities: ['Heritage tour'] },
      { dayNumber: 2, title: 'Forts & Culture', morningActivity: 'Amer Fort with light & sound show', afternoonActivity: 'Jaigarh Fort, Nahargarh', eveningActivity: 'Albert Hall Museum', nightActivity: 'Rooftop dinner', locations: ['Jaipur'], activities: ['Fort visits'] },
      { dayNumber: 3, title: 'Departure', morningActivity: 'Galtaji Temple (Monkey Temple)', afternoonActivity: 'Airport transfer', eveningActivity: '', nightActivity: '', locations: ['Jaipur'], activities: ['Temple visit'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 7499 }, { roomType: 'double', price: 9499 }]),
    departures: makeDepartures([{ date: '2026-09-01', seats: 15 }, { date: '2026-09-22', seats: 18 }], 7499),
    inclusions: makeInclusions(),
    addOns: [{ title: 'Elephant Ride', price: 999 }, { title: 'Heritage Walk Guide', price: 499 }],
  },

  // ────────── KERALA (2 packages) ──────────
  {
    title: 'Kerala Backwaters',
    destination: 'Kerala',
    durationDays: 5,
    price: 15999,
    description: 'God\'s Own Country — cruise the Alleppey backwaters on a houseboat, explore Munnar tea gardens, and relax on Kovalam beaches.',
    bannerImage: '/images/packages/kerala-backwaters.jpg',
    category: 'family_tours',
    itineraries: [
      { dayNumber: 1, title: 'Arrive Kochi', morningActivity: 'Arrive, hotel check-in', afternoonActivity: 'Fort Kochi walk, Chinese fishing nets', eveningActivity: 'Kathakali dance show', nightActivity: 'Seafood dinner at Fort Kochi', locations: ['Kochi'], activities: ['Heritage walk', 'Kathakali'] },
      { dayNumber: 2, title: 'Munnar Tea Gardens', morningActivity: 'Drive to Munnar (4 hrs)', afternoonActivity: 'Tea plantation tour and tasting', eveningActivity: 'Mattupetty Dam, Echo Point', nightActivity: 'Stay at Munnar resort', locations: ['Munnar'], activities: ['Tea tour', 'Sightseeing'] },
      { dayNumber: 3, title: 'Munnar to Alleppey', morningActivity: 'Eravikulam National Park (Nilgiri Tahr)', afternoonActivity: 'Drive to Alleppey', eveningActivity: 'Board houseboat, sunset cruise', nightActivity: 'Overnight on houseboat', locations: ['Munnar', 'Alleppey'], activities: ['Wildlife', 'Houseboat cruise'] },
      { dayNumber: 4, title: 'Backwaters to Kovalam', morningActivity: 'Morning cruise, check out of houseboat', afternoonActivity: 'Drive to Kovalam Beach', eveningActivity: 'Lighthouse Beach sunset', nightActivity: 'Ayurvedic spa experience', locations: ['Alleppey', 'Kovalam'], activities: ['Beach time', 'Spa'] },
      { dayNumber: 5, title: 'Departure', morningActivity: 'Beach yoga session', afternoonActivity: 'Transfer to Trivandrum airport', eveningActivity: '', nightActivity: '', locations: ['Kovalam', 'Trivandrum'], activities: ['Yoga', 'Departure'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 15999 }, { roomType: 'double', price: 18999 }, { roomType: 'single', price: 24999 }]),
    departures: makeDepartures([{ date: '2026-08-10', seats: 15 }, { date: '2026-09-01', seats: 20 }], 15999),
    inclusions: makeInclusions([{ type: 'inclusion', description: 'One night private houseboat cruise' }, { type: 'inclusion', description: 'Tea plantation tour' }]),
    addOns: [{ title: 'Ayurvedic Massage', price: 1499 }, { title: 'Kathakali VIP Seats', price: 599 }, { title: 'Kayaking', price: 999 }],
  },
  {
    title: 'Kerala Wellness Retreat',
    destination: 'Kerala',
    durationDays: 7,
    price: 29999,
    description: 'A rejuvenating wellness journey through Kerala. Authentic Ayurveda, yoga, organic food, and serene backwaters for complete mind-body-soul balance.',
    bannerImage: '/images/packages/kerala-wellness-retreat.jpg',
    category: 'group_tours',
    itineraries: [
      { dayNumber: 1, title: 'Arrival & Consultation', morningActivity: 'Arrive Kochi, transfer to wellness resort', afternoonActivity: 'Ayurvedic doctor consultation', eveningActivity: 'Welcome ceremony, yoga session', nightActivity: 'Sattvic dinner', locations: ['Kochi', 'Wellness Resort'], activities: ['Consultation', 'Yoga'] },
      { dayNumber: 2, title: 'Detox Day', morningActivity: 'Morning yoga and pranayama', afternoonActivity: 'Panchakarma therapy session', eveningActivity: 'Meditation by the backwaters', nightActivity: 'Herbal dinner', locations: ['Wellness Resort'], activities: ['Panchakarma', 'Meditation'] },
      { dayNumber: 3, title: 'Rejuvenation', morningActivity: 'Yoga', afternoonActivity: 'Abhyanga massage, Shirodhara', eveningActivity: 'Cooking class (organic Kerala cuisine)', nightActivity: 'Dinner', locations: ['Wellness Resort'], activities: ['Massage', 'Cooking'] },
      { dayNumber: 4, title: 'Backwater Serenity', morningActivity: 'Yoga on a houseboat', afternoonActivity: 'Houseboat cruise through Alleppey', eveningActivity: 'Sunset meditation on water', nightActivity: 'Overnight on houseboat', locations: ['Alleppey'], activities: ['Houseboat', 'Meditation'] },
      { dayNumber: 5, title: 'Nature & Healing', morningActivity: 'Herbal garden tour', afternoonActivity: 'Kerala martial arts (Kalaripayattu) demo', eveningActivity: 'Nature walk', nightActivity: 'Cultural performance', locations: ['Wellness Resort'], activities: ['Herbal tour', 'Kalaripayattu'] },
      { dayNumber: 6, title: 'Integration', morningActivity: 'Final yoga and consultation', afternoonActivity: 'Free time, pool/sauna', eveningActivity: 'Farewell ceremony', nightActivity: 'Celebratory dinner', locations: ['Wellness Resort'], activities: ['Final consultation', 'Ceremony'] },
      { dayNumber: 7, title: 'Departure', morningActivity: 'Breakfast, check out', afternoonActivity: 'Transfer to airport', eveningActivity: '', nightActivity: '', locations: ['Kochi'], activities: ['Departure'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 29999 }, { roomType: 'double', price: 35999 }, { roomType: 'single', price: 44999 }]),
    departures: makeDepartures([{ date: '2026-08-05', seats: 8 }, { date: '2026-09-01', seats: 10 }], 29999),
    inclusions: makeInclusions([{ type: 'inclusion', description: 'All Ayurvedic treatments and consultations' }, { type: 'inclusion', description: 'Organic Sattvic meals' }]),
    addOns: [{ title: 'Private Yoga Sessions', price: 2999 }, { title: 'Detox Cleanse Package', price: 4999 }],
  },

  // ────────── ANDAMAN (2 packages) ──────────
  {
    title: 'Andaman Island Hopping',
    destination: 'Andaman',
    durationDays: 6,
    price: 24999,
    description: 'Tropical paradise — visit Port Blair, Havelock Island, and Neil Island. Snorkel at Elephant Beach, scuba dive, and explore the Cellular Jail.',
    bannerImage: '/images/packages/andaman-island-hopping.jpg',
    category: 'group_tours',
    itineraries: [
      { dayNumber: 1, title: 'Port Blair Arrival', morningActivity: 'Arrive, hotel check-in', afternoonActivity: 'Cellular Jail Light & Sound Show', eveningActivity: 'Corbyn\'s Cove Beach', nightActivity: 'Seafood dinner', locations: ['Port Blair'], activities: ['Jail tour', 'Beach'] },
      { dayNumber: 2, title: 'Port Blair to Havelock', morningActivity: 'Ferry to Havelock Island', afternoonActivity: 'Radhanagar Beach (Asia\'s best beach)', eveningActivity: 'Sunset at the beach', nightActivity: 'Beach resort stay', locations: ['Havelock Island'], activities: ['Ferry', 'Beach'] },
      { dayNumber: 3, title: 'Scuba & Snorkeling', morningActivity: 'Scuba diving session', afternoonActivity: 'Snorkeling at Elephant Beach', eveningActivity: 'Kayaking through mangroves', nightActivity: 'Bonfire on the beach', locations: ['Havelock Island'], activities: ['Scuba', 'Snorkeling', 'Kayaking'] },
      { dayNumber: 4, title: 'Havelock to Neil', morningActivity: 'Ferry to Neil Island', afternoonActivity: 'Visit Bharatpur Beach and Laxmanpur Beach', eveningActivity: 'Natural Bridge at sunset', nightActivity: 'Stay at Neil Island', locations: ['Neil Island'], activities: ['Beach hopping', 'Natural Bridge'] },
      { dayNumber: 5, title: 'Neil to Port Blair', morningActivity: 'Morning at Sitapur Beach', afternoonActivity: 'Ferry back to Port Blair', eveningActivity: 'Shopping for pearls', nightActivity: 'Farewell dinner', locations: ['Neil Island', 'Port Blair'], activities: ['Beach', 'Shopping'] },
      { dayNumber: 6, title: 'Departure', morningActivity: 'Visit Chidiya Tapu (bird island)', afternoonActivity: 'Transfer to airport', eveningActivity: '', nightActivity: '', locations: ['Port Blair'], activities: ['Bird watching', 'Departure'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 24999 }, { roomType: 'double', price: 29999 }, { roomType: 'single', price: 37999 }]),
    departures: makeDepartures([{ date: '2026-10-05', seats: 12 }, { date: '2026-10-19', seats: 15 }], 24999),
    inclusions: makeInclusions([{ type: 'inclusion', description: 'Inter-island ferry tickets' }, { type: 'inclusion', description: 'Snorkeling equipment' }]),
    addOns: [{ title: 'Scuba Diving', price: 3999 }, { title: 'Sea Walk', price: 3499 }, { title: 'Glass Bottom Boat', price: 1499 }],
  },
  {
    title: 'Andaman Honeymoon Special',
    destination: 'Andaman',
    durationDays: 5,
    price: 34999,
    description: 'A romantic escape to the Andaman Islands. Candle-lit dinners, private beach experiences, and luxury resorts for the perfect honeymoon.',
    bannerImage: '/images/packages/andaman-honeymoon-special.jpg',
    category: 'group_tours',
    itineraries: [
      { dayNumber: 1, title: 'Romantic Arrival', morningActivity: 'Arrive Port Blair, luxury transfer', afternoonActivity: 'Candle-lit welcome lunch', eveningActivity: 'Couple spa session', nightActivity: 'Private beach dinner', locations: ['Port Blair'], activities: ['Spa', 'Private dinner'] },
      { dayNumber: 2, title: 'Havelock Escape', morningActivity: 'Ferry to Havelock', afternoonActivity: 'Radhanagar Beach - couples photoshoot', eveningActivity: 'Sunset cruise', nightActivity: 'Beachside candle-lit dinner', locations: ['Havelock Island'], activities: ['Photoshoot', 'Sunset cruise'] },
      { dayNumber: 3, title: 'Scuba Together', morningActivity: 'Couples scuba diving', afternoonActivity: 'Beach picnic lunch', eveningActivity: 'Kayaking for two', nightActivity: 'Bonfire with music', locations: ['Havelock Island'], activities: ['Scuba', 'Kayaking'] },
      { dayNumber: 4, title: 'Neil Island Romance', morningActivity: 'Ferry to Neil Island', afternoonActivity: 'Natural Bridge walk', eveningActivity: 'Private beach sunset', nightActivity: 'Romantic dinner', locations: ['Neil Island'], activities: ['Island exploration'] },
      { dayNumber: 5, title: 'Farewell', morningActivity: 'Sunrise at Sitapur Beach', afternoonActivity: 'Transfer to airport', eveningActivity: '', nightActivity: '', locations: ['Neil Island', 'Port Blair'], activities: ['Sunrise', 'Departure'] },
    ],
    pricingOptions: makePricing([{ roomType: 'double', price: 34999 }, { roomType: 'single', price: 44999 }]),
    departures: makeDepartures([{ date: '2026-10-10', seats: 6 }, { date: '2026-11-01', seats: 8 }], 34999),
    inclusions: makeInclusions([{ type: 'inclusion', description: 'Candle-lit beach dinner' }, { type: 'inclusion', description: 'Couples spa session' }, { type: 'inclusion', description: 'Professional photoshoot' }]),
    addOns: [{ title: 'Helicopter Transfer', price: 8999 }, { title: 'Private Yacht', price: 12999 }],
  },

  // ────────── LEH LADAKH (2 packages) ──────────
  {
    title: 'Leh Ladakh Road Trip',
    destination: 'Leh Ladakh',
    durationDays: 8,
    price: 25999,
    description: 'The ultimate Ladakh road trip via Manali. Cross high-altitude passes, visit Pangong Lake, Nubra Valley, and monasteries on this epic journey.',
    bannerImage: '/images/packages/leh-ladakh-road-trip.jpg',
    category: 'group_tours',
    itineraries: [
      { dayNumber: 1, title: 'Manali to Jispa', morningActivity: 'Depart Manali via Rohtang Pass', afternoonActivity: 'Cross Keylong, arrive Jispa', eveningActivity: 'Camp by Bhaga river', nightActivity: 'Stargazing', locations: ['Manali', 'Rohtang', 'Jispa'], activities: ['Road trip', 'Camping'] },
      { dayNumber: 2, title: 'Jispa to Leh', morningActivity: 'Cross Baralacha La (4890m)', afternoonActivity: 'Pass Tanglang La (5328m)', eveningActivity: 'Arrive Leh, check-in', nightActivity: 'Rest (acclimatization)', locations: ['Baralacha La', 'Tanglang La', 'Leh'], activities: ['High pass crossing', 'Arrival'] },
      { dayNumber: 3, title: 'Leh Acclimatization', morningActivity: 'Visit Shanti Stupa', afternoonActivity: 'Leh Palace, local market', eveningActivity: 'Hall of Fame museum', nightActivity: 'Dinner at Tibetan Kitchen', locations: ['Leh'], activities: ['Acclimatization', 'Sightseeing'] },
      { dayNumber: 4, title: 'Nubra Valley', morningActivity: 'Cross Khardung La (5359m)', afternoonActivity: 'Diskit Monastery, Hunder Sand Dunes', eveningActivity: 'Double-humped camel ride', nightActivity: 'Camp in Nubra', locations: ['Khardung La', 'Nubra Valley'], activities: ['Highest motorable pass', 'Camel ride'] },
      { dayNumber: 5, title: 'Nubra to Pangong', morningActivity: 'Drive via Shyok route', afternoonActivity: 'Arrive Pangong Lake', eveningActivity: 'Sunset at the lake', nightActivity: 'Camp by Pangong', locations: ['Pangong Lake'], activities: ['Lake visit', 'Camping'] },
      { dayNumber: 6, title: 'Pangong to Leh', morningActivity: 'Sunrise at Pangong', afternoonActivity: 'Via Chang La (5360m)', eveningActivity: 'Visit Thiksey Monastery', nightActivity: 'Return to Leh', locations: ['Pangong', 'Chang La', 'Thiksey'], activities: ['Sunrise', 'Monastery'] },
      { dayNumber: 7, title: 'Leh to Sarchu', morningActivity: 'Depart Leh via Upshi', afternoonActivity: 'Cross Lachulung La, arrive Sarchu', eveningActivity: 'Camp at Sarchu (4253m)', nightActivity: 'Last night under stars', locations: ['Sarchu'], activities: ['Camping'] },
      { dayNumber: 8, title: 'Sarchu to Manali', morningActivity: 'Cross Baralacha La again', afternoonActivity: 'Arrive Manali', eveningActivity: 'Trip ends', nightActivity: '', locations: ['Manali'], activities: ['Return journey'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 25999 }, { roomType: 'triple', price: 27999 }, { roomType: 'double', price: 30999 }]),
    departures: makeDepartures([{ date: '2026-06-15', seats: 12 }, { date: '2026-07-01', seats: 15 }, { date: '2026-07-20', seats: 10 }], 25999),
    inclusions: makeInclusions([{ type: 'inclusion', description: 'Camping equipment and tents' }, { type: 'inclusion', description: 'Oxygen cylinder in vehicle' }]),
    addOns: [{ title: 'Inner Line Permit Fast Track', price: 999 }, { title: 'Bike Rental (RE Himalayan)', price: 14999 }],
  },
  {
    title: 'Ladakh Photography Expedition',
    destination: 'Leh Ladakh',
    durationDays: 10,
    price: 39999,
    description: 'A photographer\'s dream — capture the dramatic landscapes of Ladakh, from monasteries to high-altitude lakes to star trails under dark skies.',
    bannerImage: '/images/packages/ladakh-photography-expedition.jpg',
    category: 'group_tours',
    itineraries: [
      { dayNumber: 1, title: 'Fly to Leh', morningActivity: 'Fly to Leh (recommended for acclimatization)', afternoonActivity: 'Rest day — mandatory altitude rest', eveningActivity: 'Shanti Stupa sunset shoot', nightActivity: 'Astrophotography intro session', locations: ['Leh'], activities: ['Acclimatization', 'Photo shoot'] },
      { dayNumber: 2, title: 'Leh Heritage', morningActivity: 'Thiksey Monastery morning prayers shoot', afternoonActivity: 'Hemis Monastery', eveningActivity: 'Leh Palace blue hour', nightActivity: 'Star trails at Stok', locations: ['Thiksey', 'Hemis', 'Leh Palace'], activities: ['Monastery photography'] },
      { dayNumber: 3, title: 'Nubra Valley', morningActivity: 'Khardung La sunrise shoot', afternoonActivity: 'Diskit Monastery and Maitreya Buddha', eveningActivity: 'Hunder dunes golden hour', nightActivity: 'Milky Way over dunes', locations: ['Khardung La', 'Nubra'], activities: ['Landscape photography'] },
      { dayNumber: 4, title: 'Nubra Exploration', morningActivity: 'Turtuk village (near Pakistan border)', afternoonActivity: 'Local Balti culture portraits', eveningActivity: 'Return to Hunder', nightActivity: 'Timelapse session', locations: ['Turtuk', 'Hunder'], activities: ['Village photography'] },
      { dayNumber: 5, title: 'Pangong Lake', morningActivity: 'Drive via Shyok to Pangong', afternoonActivity: 'Arrive, afternoon shoot', eveningActivity: 'Pangong sunset — iconic shots', nightActivity: 'Night sky over Pangong', locations: ['Pangong Lake'], activities: ['Lake photography', 'Night sky'] },
      { dayNumber: 6, title: 'Pangong Sunrise', morningActivity: 'Pangong sunrise shoot', afternoonActivity: 'Drive back via Chang La', eveningActivity: 'Return to Leh', nightActivity: 'Photo review session', locations: ['Pangong', 'Chang La'], activities: ['Sunrise shoot'] },
      { dayNumber: 7, title: 'Tso Moriri', morningActivity: 'Drive to Tso Moriri (4-5 hrs)', afternoonActivity: 'Lake shoot — less crowded', eveningActivity: 'Golden hour reflections', nightActivity: 'Night sky shoot', locations: ['Tso Moriri'], activities: ['Lake photography'] },
      { dayNumber: 8, title: 'Tso Kar', morningActivity: 'Early morning at Tso Moriri', afternoonActivity: 'Tso Kar salt lake', eveningActivity: 'Return to Leh', nightActivity: 'Rest', locations: ['Tso Moriri', 'Tso Kar'], activities: ['Salt lake photography'] },
      { dayNumber: 9, title: 'Leh Wrap-up', morningActivity: 'Alchi Monastery', afternoonActivity: 'Confluence of Indus-Zanskar', eveningActivity: 'Final sunset shoot', nightActivity: 'Photo editing workshop', locations: ['Alchi', 'Nimmu'], activities: ['Final shoots', 'Workshop'] },
      { dayNumber: 10, title: 'Departure', morningActivity: 'Last-minute street photography', afternoonActivity: 'Fly out', eveningActivity: '', nightActivity: '', locations: ['Leh'], activities: ['Departure'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 39999 }, { roomType: 'double', price: 44999 }]),
    departures: makeDepartures([{ date: '2026-07-05', seats: 8 }, { date: '2026-08-01', seats: 6 }], 39999),
    inclusions: makeInclusions([{ type: 'inclusion', description: 'Professional photo guide and workshops' }, { type: 'inclusion', description: 'All inner line permits' }]),
    addOns: [{ title: 'Drone Photography Session', price: 4999 }, { title: 'Photo Book Print', price: 2999 }],
  },

  // ────────── RISHIKESH (2 packages) ──────────
  {
    title: 'Rishikesh Adventure',
    destination: 'Rishikesh',
    durationDays: 3,
    price: 5999,
    description: 'The adventure capital of India — river rafting, bungee jumping, camping by the Ganga, and yoga in the yoga capital of the world.',
    bannerImage: '/images/packages/rishikesh-adventure.jpg',
    category: 'weekend_trips',
    itineraries: [
      { dayNumber: 1, title: 'Arrival & Rapids', morningActivity: 'Arrive Rishikesh, camp check-in', afternoonActivity: 'River rafting (Shivpuri to Rishikesh - 16 km)', eveningActivity: 'Beach volleyball at camp', nightActivity: 'Bonfire with music', locations: ['Rishikesh', 'Shivpuri'], activities: ['Rafting', 'Camping'] },
      { dayNumber: 2, title: 'Adventure Day', morningActivity: 'Bungee jumping at Jumpin Heights', afternoonActivity: 'Cliff jumping and body surfing', eveningActivity: 'Ganga Aarti at Triveni Ghat', nightActivity: 'Night walk to Beatles Ashram', locations: ['Rishikesh'], activities: ['Bungee', 'Ganga Aarti'] },
      { dayNumber: 3, title: 'Yoga & Depart', morningActivity: 'Yoga and meditation session', afternoonActivity: 'Visit Laxman Jhula, depart', eveningActivity: '', nightActivity: '', locations: ['Rishikesh'], activities: ['Yoga', 'Sightseeing'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 5999 }, { roomType: 'double', price: 7999 }]),
    departures: makeDepartures([{ date: '2026-06-06', seats: 25 }, { date: '2026-06-20', seats: 30 }, { date: '2026-07-04', seats: 22 }], 5999),
    inclusions: makeInclusions([{ type: 'inclusion', description: 'River rafting (Grade 3-4 rapids)' }, { type: 'inclusion', description: 'Camping by Ganga' }]),
    addOns: [{ title: 'Bungee Jumping', price: 3499 }, { title: 'Giant Swing', price: 3499 }, { title: 'Flying Fox', price: 1799 }],
  },
  {
    title: 'Rishikesh Yoga Retreat',
    destination: 'Rishikesh',
    durationDays: 5,
    price: 12999,
    description: 'Deepen your yoga practice in the world capital of yoga. Daily asana, pranayama, meditation, and spiritual teachings by the sacred Ganga.',
    bannerImage: '/images/packages/rishikesh-yoga-retreat.jpg',
    category: 'group_tours',
    itineraries: [
      { dayNumber: 1, title: 'Arrival & Orientation', morningActivity: 'Arrive, ashram check-in', afternoonActivity: 'Orientation and intention-setting', eveningActivity: 'Gentle yoga and Ganga Aarti', nightActivity: 'Sattvic dinner, silence', locations: ['Rishikesh'], activities: ['Orientation', 'Yoga'] },
      { dayNumber: 2, title: 'Hatha & Pranayama', morningActivity: 'Sunrise Hatha yoga (2 hrs)', afternoonActivity: 'Pranayama workshop', eveningActivity: 'Meditation by Ganga', nightActivity: 'Yoga philosophy discussion', locations: ['Rishikesh'], activities: ['Hatha yoga', 'Pranayama'] },
      { dayNumber: 3, title: 'Ashtanga & Nature', morningActivity: 'Led Ashtanga primary series', afternoonActivity: 'Nature walk to waterfall', eveningActivity: 'Yin yoga and sound healing', nightActivity: 'Kirtan (devotional chanting)', locations: ['Rishikesh'], activities: ['Ashtanga', 'Sound healing'] },
      { dayNumber: 4, title: 'Deepening Practice', morningActivity: 'Advanced asana workshop', afternoonActivity: 'Anatomy of yoga', eveningActivity: 'Trataka (candle gazing) meditation', nightActivity: 'Silent dinner', locations: ['Rishikesh'], activities: ['Advanced yoga', 'Anatomy'] },
      { dayNumber: 5, title: 'Integration & Depart', morningActivity: 'Final practice and closing circle', afternoonActivity: 'Check out, depart', eveningActivity: '', nightActivity: '', locations: ['Rishikesh'], activities: ['Closing', 'Departure'] },
    ],
    pricingOptions: makePricing([{ roomType: 'sharing', price: 12999 }, { roomType: 'double', price: 15999 }, { roomType: 'single', price: 18999 }]),
    departures: makeDepartures([{ date: '2026-06-01', seats: 10 }, { date: '2026-06-15', seats: 8 }, { date: '2026-07-01', seats: 12 }], 12999),
    inclusions: makeInclusions([{ type: 'inclusion', description: 'All yoga sessions and workshops' }, { type: 'inclusion', description: 'Sattvic vegetarian meals' }]),
    addOns: [{ title: 'Private Yoga Session', price: 1999 }, { title: 'Ayurvedic Consultation', price: 1499 }],
  },
];

async function main() {
  console.log('Cleaning existing travel packages...');
  await cleanAll();

  console.log(`Seeding ${packages.length} travel packages...`);

  for (const pkgData of packages) {
    const pkg = await createPackage(pkgData);
    console.log(`  ✓ ${pkg.title} (${pkg.destination})`);
  }

  console.log(`\n✅ Successfully seeded ${packages.length} packages across 10 destinations!`);
  console.log('   Goa, Manali, Shimla, Kedarnath, Kashmir, Rajasthan, Kerala, Andaman, Leh Ladakh, Rishikesh');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
