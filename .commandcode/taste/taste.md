# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# design-system
- Use GREEN theme palette: Primary #0F766E, Secondary #14B8A6, Accent #22D3EE, Background #F0FDFA, Dark #022C22. Confidence: 0.85
- Use rounded cards (16px border radius), soft shadows, smooth hover effects, and clean spacing. Confidence: 0.75

# architecture
- All package data must be database-driven; no static or hardcoded packages in the frontend. Confidence: 0.85
- After seeding packages, verify all packages render on the frontend — seeding N packages without verification is insufficient. Confidence: 0.70

# seed-data
- Use destination-relevant images: no mismatched locations (e.g., no Taj Mahal for Shimla), and every package must have a working image. Confidence: 0.70

# ui-exclusions
- Exclude stats sections, mobile app sections, and admin panel links from customer-facing UI. Confidence: 0.80

# ux
- Use horizontal scroll with left/right arrow buttons for featured packages section. Confidence: 0.75
- Implement tab switching without page reload and enable smooth scrolling between sections. Confidence: 0.70
- Hero/landing section should be compact — not taking up the entire first page. Confidence: 0.70

# navigation
- Navbar should include visible navigation links (Home, Packages, Bookings, Profile), not just login/signup. Confidence: 0.70

# payments
- Use Razorpay test mode for payment integration with keys: rzp_test_SX7yGkGVOxF306 / ssbuuAz1XTsvMUNk4OSO5JUG. Confidence: 0.50
