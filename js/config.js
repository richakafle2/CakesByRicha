/* ==========================================================
   Cakes by Richa — site settings
   Edit the values below; every page reads from here.
   ========================================================== */
window.CBR_CONFIG = {
  businessName: "Cakes by Richa",

  // ---- Contact footer -------------------------------------
  contact: {
    email: "cakesbyricha1@gmail.com",          // <- your business email
    phone: "(972) 900-2932",             // <- your phone / text number ("" to hide)
    instagram: "cakes_by_richa1",           // <- handle without @ ("" to hide)
    location: "San Diego, CA · pickup only"
  },

  // ---- Google Form ----------------------------------------
  // Paste your Google Form link here.
  // To have clipped reference codes filled in automatically, use a
  // PRE-FILLED link instead (see README): in Google Forms, ⋮ menu →
  // "Get pre-filled link", type REF-TEST in your "Reference codes"
  // question, click "Get link", copy it, and paste it below.
  // The site swaps REF-TEST for the customer's clipped codes.
  googleFormLink: "https://forms.gle/m72fiRgSCfuDJ3rS8",

  // ---- AI design preview ----------------------------------
  // URL of your deployed Cloudflare Worker (see worker/README.md).
  // Leave "" to hide the AI preview section.
  aiEndpoint: "",
  maxAiImages: 4   // max reference photos sent to the image model
};
