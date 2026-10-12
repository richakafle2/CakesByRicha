/* ==========================================================
   Cakes by Richa — site settings
   Edit the values below; every page reads from here.
   ========================================================== */
window.CBR_CONFIG = {
  businessName: "Cakes by Richa",

  // ---- Contact footer -------------------------------------
  contact: {
    email: "cakesbyricha1@gmail.com",          // <- your business email
    phone: "(972) 900 - 2932",             // <- your phone / text number ("" to hide)
    instagram: "cakes_by_richa1",           // <- handle without @ ("" to hide)
    location: "San Diego, CA · pickup only"
  },

  // ---- Order form -----------------------------------------
  // FormSubmit sends each order to this inbox. The first time someone
  // submits, FormSubmit emails you a one-time "activate" link.
  formsubmitEmail: "hello@example.com",
  // Where FormSubmit sends people after they submit:
  thankYouUrl: "https://cakebyrichaorderform.com/thanks.html",

  // ---- AI design preview ----------------------------------
  // URL of your deployed Cloudflare Worker (see worker/README.md).
  // Leave "" to hide the AI preview section.
  aiEndpoint: "",
  maxAiImages: 4   // max reference photos sent to the image model
};
