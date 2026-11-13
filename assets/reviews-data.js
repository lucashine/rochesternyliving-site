/* Rochester NY Living — published client reviews.
   ---------------------------------------------------------------------------
   THIS IS THE ONLY FILE YOU EDIT WHEN YOU APPROVE A REVIEW.

   A review arrives by email when someone submits the form on /reviews.
   You read it, you decide, and if you publish it you paste one block below.
   Nothing appears on the site until you put it here.

   Copy this template, fill it in, and put it at the TOP of the list
   (newest first — the page displays them in the order they appear here):

     {
       name:   "Sarah M.",        // first name + last initial ONLY. Never a full last name.
       rating: 5,                 // whole number, 1 through 5
       role:   "Buyer",           // "Buyer", "Seller", or "Buyer & seller"
       town:   "Penfield",        // town or area. Use "" to leave it off.
       date:   "2026-07",         // YYYY-MM. Displays as "July 2026".
       text:   "What they wrote."
       // optional, only for reviews copied from another site:
       // source: "Zillow", sourceUrl: "https://..."
     },

   BEFORE YOU PASTE — read the four rules in REVIEWS-README.md.
   The short version:
     1. No full last names, no street addresses, no house numbers.
     2. No fair housing language. If the review calls an area "safe",
        "family", "good schools", "up-and-coming", or anything about who
        lives there — cut that sentence. Publishing it makes it your ad copy.
     3. No dollar outcomes stated as a promise ("he'll get you over asking").
        Past fact in their own words is fine; implied future result is not.
     4. Only trim for length, privacy, and the two rules above. Never
        rewrite someone's opinion or upgrade their rating.

   Watch the syntax: every entry ends with a comma, text is in "quotes",
   and any quote mark inside the text needs a backslash: \"like this\".
   --------------------------------------------------------------------------- */

window.REVIEWS = [

  /* New reviews go at the TOP of this list, above the Zillow imports. */

  /* Submitted via the site form 13 Nov 2026, consent given. Passed the four checks. */
  {
    name:   "Nick L.",
    rating: 5,
    role:   "Buyer",
    town:   "Greece",
    date:   "2026-11",
    text:   "Lucas was a great communicator, on top of things, and quickly responded to any questions or concerns we had. This was a smooth process for us and Lucas made things easy and exciting searching for a home. He took his time with us explaining processes and expectations so we weren’t surprised, which helped prepared for everything that comes with searching and buying a home."
  },

  /* Imported 12 Nov 2026 from Lucas's Zillow profile (zillow.com/profile/lucashine), verbatim,
     with his approval. Names shortened to first name + last initial from the public Zillow
     username. Each passed the four checks in REVIEWS-README.md. */
  {
    name:   "Rob B.",
    rating: 5,
    role:   "Buyer",
    town:   "Rochester",
    date:   "2021-08",
    text:   "Lucas is very knowledgeable and helpful. Always willing and able to provide information and advice. He showed my wife and I many homes within our budget and with the specifications desired. Highly recommended.",
    source: "Zillow",
    sourceUrl: "https://www.zillow.com/profile/lucashine"
  },
  {
    name:   "Victor V.",
    rating: 5,
    role:   "Buyer & seller",
    town:   "Rochester",
    date:   "2021-08",
    text:   "Once we found a house we wanted Lucas was in contact with us at all times. Sometimes 6 times a day! He made sure all went smooth! The whole process of buying and selling our old home was stressful. Thanks Lucas!",
    source: "Zillow",
    sourceUrl: "https://www.zillow.com/profile/lucashine"
  },
  {
    name:   "Lauren C.",
    rating: 5,
    role:   "Buyer",
    town:   "Rochester",
    date:   "2021-08",
    text:   "Lucas is great to work with! He made a notoriously annoying and frustrating process of buying a house into a fun and exciting process. I found and bought a house (under asking price) that I absolutely love and have been living in for 4 years now. Would absolutely work with him again!",
    source: "Zillow",
    sourceUrl: "https://www.zillow.com/profile/lucashine"
  },
  {
    name:   "Sarah V.",
    rating: 5,
    role:   "Buyer",
    town:   "Ontario, NY",
    date:   "2019-01",
    text:   "Lucas stepped up to help me with an offer when my agent was away. He had a lot of knowledge and great advice for my situation. He made the process very easy for me.",
    source: "Zillow",
    sourceUrl: "https://www.zillow.com/profile/lucashine"
  },

];
