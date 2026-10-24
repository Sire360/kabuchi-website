# Kabuchi Spa & Beauty: Website

This folder holds the full website. It works on GitHub Pages, which hosts it for free.

## What's inside

| File / folder | What it is |
|---|---|
| `index.html` | Home page |
| `about.html` | About us: story, vision, mission, values, team |
| `services.html` | All 8 services, plus the nail services menu |
| `gallery.html` | Photo gallery with filters, and before & after photos |
| `training.html` | Nail Technician Training course (K1,800, 2 weeks) |
| `booking.html` | **Online booking in 4 steps:** Service → Date & Time → Your Details → Done |
| `contact.html` | Address, phones, opening hours and map |
| `404.html` | Shown when a page isn't found |
| `css/style.css` | All colours, fonts and layout |
| `js/main.js` | Menu, animations and gallery |
| `js/booking.js` | How the booking steps work |
| `js/booking-config.js` | **Booking settings: the only file you need to edit** |
| `booking-setup/Code.gs` | Google Sheet script that saves bookings and sends emails |
| `images/` | Photos, logo and icons |

---

## Part 1: Put the website online with GitHub (free)

1. Create a free account at **github.com**. Choose a short username, such as `kabuchispa`.
2. Click **+** (top right), then **New repository**.
   - **Name:** `kabuchi-website`. If you name it `kabuchispa.github.io` (your username + `.github.io`), the site will sit at the shorter address `https://kabuchispa.github.io`.
   - Choose **Public**, then click **Create repository**.
3. On the new repository page, click **uploading an existing file**.
4. Open this folder on your computer and drag in **everything inside it**: all the `.html` files plus the `css`, `js`, `images` and `booking-setup` folders. Then click **Commit changes**.
5. Go to **Settings → Pages**. Under **Build and deployment**, set **Source** to *Deploy from a branch*, **Branch** to `main`, and the folder to `/ (root)`. Click **Save**.
6. Wait 1–2 minutes and refresh the page. GitHub shows your link, for example:
   `https://kabuchispa.github.io/kabuchi-website/`

**To change something later:** open the file on GitHub, click the ✏️ pencil, make your edit and click **Commit changes**. The site updates within a minute or two.

---

## Part 2: Set up online bookings (free, about 10 minutes)

When this is set up, the booking page will:

- ✅ Save every booking in a Google Sheet
- ✅ Hide times that are already full, so nobody double-books
- ✅ Email the customer a branded confirmation
- ✅ Send the customer an automatic **WhatsApp** confirmation, once you complete Part 3
- ✅ Email Kabuchi about each new booking

### Steps

1. Go to **sheets.google.com**, signed in with the Gmail account the spa will use. Create a blank sheet and call it **Kabuchi Bookings**.
2. In the sheet, click **Extensions → Apps Script**.
3. Delete the code that's already there. Paste in **everything** from `booking-setup/Code.gs`.
4. At the top of the code, under `SETTINGS`, check these values:
   - `NOTIFY_EMAIL`: the email that should receive new-booking alerts
   - `CLIENTS_PER_SLOT`: how many clients you can serve at the same time (it starts at **2**)
   - `WEBSITE` and `LOGO_URL` are already set to `sire360.github.io`. Change them only if you move to your own domain
5. Click 💾 **Save**. In the function menu at the top, choose **setup** and click **Run**.
   Google will ask for permission. Click **Review permissions**, choose your account, then **Advanced → Go to project (unsafe) → Allow**. This is normal for your own scripts. A **Bookings** tab will appear in your sheet.
6. Click **Deploy → New deployment**. Click the ⚙️ icon and choose **Web app**, then set:
   - **Execute as:** *Me*
   - **Who has access:** *Anyone*
   Click **Deploy** and **copy the Web app URL**. It ends in `/exec`.
7. On GitHub, open `js/booking-config.js`, click ✏️ and paste the URL between the quotes:
   ```js
   SCRIPT_URL: 'https://script.google.com/macros/s/AKfy...../exec',
   ```
   Click **Commit changes**.
8. Make a test booking on the website with your own email. You should receive the confirmation email, and the booking should appear in the sheet. 🎉

### Managing bookings

- Every booking is a row in the **Bookings** tab.
- **To cancel a booking:** change its **Status** to `Cancelled`. That time becomes free again on the website.
- You can also mark bookings as `Completed` or `No-show`.
- **WhatsApp status:** the last column shows `sent`, `failed` (for example, the number isn't on WhatsApp), `not connected` (Part 3 isn't done yet) or `not requested`.
- **When a WhatsApp wasn't sent automatically,** the "New booking" email has a green button. Tap it on your phone and WhatsApp opens a chat to the customer with the confirmation already written, so you just press send.

### Good to know

- A free Gmail account can send about **100 emails a day**. That's plenty for a spa.
- If you change `Code.gs` later, click **Deploy → Manage deployments → ✏️ Edit**, set **Version** to *New version*, and click **Deploy**. The URL stays the same.
- Until `SCRIPT_URL` is filled in, the booking page still works: it sends each booking to Kabuchi on WhatsApp instead.
- Customers can tick or untick "Send my confirmation to WhatsApp" on the booking form.

---

## Part 3: Automatic WhatsApp confirmations (WhatsApp Cloud API)

With this connected, customers receive a WhatsApp message like this a few seconds after booking:

> Hello Mary, your appointment at Kabuchi Spa & Beauty is confirmed ✅
> Ref: KB-7QX4M · Service: Massage – Back & Neck · Date: Sunday, 25 October 2026 at 12:00 …

This uses **Meta's official WhatsApp Cloud API**. It's the only reliable, allowed way for a website to send WhatsApp messages automatically.

### Before you start: costs and the phone number

- **Cost:** Meta charges a small fee for each confirmation **delivered** (a "utility" message). Zambia uses Meta's **"Rest of Africa"** rate, which is usually a few US cents per message. You need to add a payment card in Meta Business. Check the current rate here: https://developers.facebook.com/docs/whatsapp/pricing
- **Phone number:** the number that sends the automatic messages must be connected to the Cloud API. You have two choices:
  1. **Simplest:** buy a **separate SIM** just for automatic confirmations. Keep **+260 973 879 988** on your phone as normal for chatting with clients.
  2. **Use the same number (+260 973 879 988):** Meta's "coexistence" lets one number work in both the WhatsApp Business app and the API. The number must be on the **WhatsApp Business app** (not plain WhatsApp), and it's set up through Meta's Embedded Signup, usually with a provider (BSP) such as Twilio, Telnyx, 360dialog or Wati. If you register the number directly on the Cloud API without coexistence, it **stops working in the normal WhatsApp app**.

### Steps

1. **Create a Meta Business account** at **business.facebook.com**. Use the business name *Kabuchi Spa & Beauty*.
2. **Create a Meta app.** Go to **developers.facebook.com → My Apps → Create app**, choose **Business**, and link it to your Kabuchi business account.
3. In the app, click **Add product → WhatsApp → Set up**.
4. **Add your phone number.** Go to **WhatsApp → API Setup → Add phone number**. Enter the display name *Kabuchi Spa & Beauty* and verify the number by SMS or call.
   Copy the **Phone number ID** shown on that page.
5. **Create the message template.** Go to **WhatsApp Manager → Message templates → Create template**.
   - **Category:** Utility
   - **Name:** `booking_confirmation`
   - **Language:** English
   - **Body:** copy this text exactly. The `{{1}}` to `{{5}}` placeholders are filled in automatically.
     ```
     Hello {{1}}, your appointment at Kabuchi Spa & Beauty is confirmed ✅

     Ref: {{2}}
     Service: {{3}}
     Date: {{4}}
     Time: {{5}}
     Where: 13 Mwapona Road, Woodlands, Lusaka

     Need to change it? Reply to this message or call +260 973 879 988. See you soon!
     ```
   - When Meta asks for sample values, enter: `Mary`, `KB-7QX4M`, `Massage`, `Sunday, 25 October 2026`, `12:00`.
   - Submit it. Approval usually takes from a few minutes to a day.
6. **Get a permanent access token.**
   - Go to **business.facebook.com → Settings → Users → System users**. Click **Add**, choose the **Admin** role, then **Add assets**, select your app and give it **Full control**.
   - Click **Generate new token**, choose your app, tick **whatsapp_business_messaging** and **whatsapp_business_management**, and set expiry to **Never**.
   - **Copy the token** and keep it secret.
7. **Add a payment method** in WhatsApp Manager under **Payment settings**.
8. **Connect it to the booking script.**
   - Open your Google Sheet, go to **Extensions → Apps Script**, then ⚙️ **Project Settings → Script properties → Add script property**.
   - Add these two properties, then click **Save**:
     - `WA_TOKEN`: your token from step 6
     - `WA_PHONE_NUMBER_ID`: the Phone number ID from step 4
9. **Test it.** In the Apps Script editor, open `Code.gs` and find `testWhatsApp`. Put your own number in it (for example `260971234567`), select **testWhatsApp** in the function menu and click **Run**. You should receive the WhatsApp message.
10. **Redeploy.** Go to **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**.

From then on, each booking sends **both** an email and a WhatsApp confirmation. The sheet's **WhatsApp status** column shows whether each message was sent.

### If a WhatsApp message fails

- **"not connected":** `WA_TOKEN` or `WA_PHONE_NUMBER_ID` is missing from Script properties.
- **Template errors:** the template name must be exactly `booking_confirmation` and the template must be **Approved**.
- **"Message undeliverable":** the customer's number isn't on WhatsApp. They still receive the email, and Kabuchi's alert email includes a button to contact them.

---

## Part 4: A domain name (web address)

**Free option:** GitHub gives you a free address like `kabuchispa.github.io`. It's secure (https) and costs nothing. This is the best place to start.

**Completely free custom domains:** there aren't any reliable ones for a business.

- Freenom (.tk, .ml and others), which used to offer them, has shut down.
- eu.org is free but can take weeks or months to approve.
- Services like is-a.dev are only for developers' personal sites.

**Recommended:** buy your own name. It usually costs around **US$10–15 a year** for a `.com`, or you can get a Zambian `.co.zm` from a local registrar. Examples:

- `kabuchispa.com` or `kabuchibeauty.com`: buy from Namecheap, Cloudflare, Porkbun or GoDaddy
- `kabuchi.co.zm`: buy from a ZICTA-accredited Zambian registrar

**Connecting your domain to GitHub Pages:**

1. On GitHub, go to **Settings → Pages → Custom domain**. Type your domain (for example `www.kabuchispa.com`) and click **Save**.
2. At the company where you bought the domain, add these DNS records:
   - `CNAME` record: name `www`, value `sire360.github.io`
   - Four `A` records for the main domain (`@`): `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
3. Wait up to 24 hours, then tick **Enforce HTTPS** in GitHub Pages.
4. In `booking-setup/Code.gs`, update `WEBSITE` and `LOGO_URL` to the new address, and redeploy as described above.

---

## Still to add

- Facebook, Instagram and TikTok links: in each `.html` file, look for the comment `Add your social pages here` in the footer.
- Prices: the services page currently shows "Ask for prices" buttons that open WhatsApp.
- Staff photos: the team section uses initials (B, D, J) for now.
- Photos: check you have permission for every photo you upload.
  - Most are free stock photos from Unsplash and Pexels.
  - `images/svc-nails.jpg`, `nails-green.jpg`, `nail-pedicure.jpg`, `nail-art.jpg`, `before.jpg`, `after.jpg` and `pedicure-work.jpg` are your own or client photos.

*Care • Beauty • A Brighter You*
