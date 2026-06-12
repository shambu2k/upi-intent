// src/core/params.ts
var VALIDATION_RULES = {
  pa: {
    required: true,
    maxLength: 255,
    pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/,
    description: "Valid VPA format (user@psp)"
  },
  pn: {
    required: true,
    maxLength: 99,
    description: "Payee name"
  },
  am: {
    required: false,
    pattern: /^\d+(\.\d{1,2})?$/,
    maxLength: 18,
    description: "Amount in INR (up to 2 decimal places)"
  },
  cu: {
    required: false,
    allowedValues: ["INR"],
    description: "Currency code (must be INR)"
  },
  tr: {
    required: false,
    maxLength: 35,
    pattern: /^[a-zA-Z0-9-]+$/,
    description: "Transaction reference (alphanumeric with hyphens)"
  },
  tn: {
    required: false,
    maxLength: 100,
    description: "Transaction note"
  },
  url: {
    required: false,
    maxLength: 200,
    pattern: /^https?:\/\/.+/,
    description: "Valid HTTP/HTTPS URL"
  },
  mode: {
    required: false,
    maxLength: 20,
    description: "Transaction mode"
  },
  orgid: {
    required: false,
    maxLength: 20,
    description: "Organization ID"
  },
  sign: {
    required: false,
    maxLength: 500,
    description: "Digital signature"
  },
  mc: {
    required: false,
    maxLength: 4,
    pattern: /^\d{4}$/,
    description: "Merchant Category Code (4 digits)"
  },
  tid: {
    required: false,
    maxLength: 35,
    description: "Transaction ID"
  }
};
function validateUpiParams(params) {
  const errors = [];
  const normalizedParams = {};
  if (!params.pa || typeof params.pa !== "string" || params.pa.trim() === "") {
    errors.push("Payee Address (pa) is required");
  }
  if (!params.pn || typeof params.pn !== "string" || params.pn.trim() === "") {
    errors.push("Payee Name (pn) is required");
  }
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    const stringValue = String(value).trim();
    if (stringValue === "") {
      continue;
    }
    const rule = VALIDATION_RULES[key];
    if (rule) {
      if (rule.maxLength && stringValue.length > rule.maxLength) {
        errors.push(`${key}: exceeds maximum length of ${rule.maxLength} characters`);
        continue;
      }
      if (rule.pattern && !rule.pattern.test(stringValue)) {
        errors.push(`${key}: invalid format. ${rule.description}`);
        continue;
      }
      if (rule.allowedValues && !rule.allowedValues.includes(stringValue)) {
        errors.push(`${key}: must be one of ${rule.allowedValues.join(", ")}`);
        continue;
      }
      normalizedParams[key] = stringValue;
    } else {
      normalizedParams[key] = stringValue;
    }
  }
  if (normalizedParams.am && !normalizedParams.cu) {
    normalizedParams.cu = "INR";
  }
  return {
    isValid: errors.length === 0,
    errors,
    normalizedParams
  };
}
function buildUpiUri(params, action = "pay") {
  const validation = validateUpiParams(params);
  if (!validation.isValid) {
    throw new Error(`Invalid UPI parameters: ${validation.errors.join(", ")}`);
  }
  const queryParams = new URLSearchParams;
  const orderedKeys = ["pa", "pn", "am", "cu", "tr", "tn", "url", "mode", "orgid", "mc", "tid", "sign"];
  for (const key of orderedKeys) {
    const value = validation.normalizedParams[key];
    if (value !== undefined && value !== "") {
      queryParams.append(key, value);
    }
  }
  for (const [key, value] of Object.entries(validation.normalizedParams)) {
    if (!orderedKeys.includes(key) && value !== undefined && value !== "") {
      queryParams.append(key, value);
    }
  }
  const queryString = queryParams.toString();
  return `upi://${action}${queryString ? `?${queryString}` : ""}`;
}
function parseUpiUri(upiUri) {
  try {
    const url = new URL(upiUri);
    if (url.protocol !== "upi:") {
      throw new Error("Invalid UPI URI: must start with upi://");
    }
    const action = url.hostname;
    if (action !== "pay" && action !== "mandate") {
      throw new Error('Invalid UPI action: must be "pay" or "mandate"');
    }
    const params = {};
    for (const [key, value] of url.searchParams.entries()) {
      params[key] = value;
    }
    const validation = validateUpiParams(params);
    if (!validation.isValid) {
      throw new Error(`Invalid UPI parameters: ${validation.errors.join(", ")}`);
    }
    return {
      action,
      params: validation.normalizedParams
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to parse UPI URI");
  }
}
function createPaymentUri(payeeAddress, payeeName, amount, note) {
  const params = {
    pa: payeeAddress,
    pn: payeeName,
    cu: "INR"
  };
  if (amount) {
    params.am = amount;
  }
  if (note) {
    params.tn = note;
  }
  return buildUpiUri(params, "pay");
}
function createMandateUri(payeeAddress, payeeName, amount, note, transactionRef) {
  const params = {
    pa: payeeAddress,
    pn: payeeName,
    cu: "INR"
  };
  if (amount) {
    params.am = amount;
  }
  if (note) {
    params.tn = note;
  }
  if (transactionRef) {
    params.tr = transactionRef;
  }
  return buildUpiUri(params, "mandate");
}
// src/data/apps.json
var apps_default = [{ id: "generic", label: "Any UPI app", android: { pay: "upi://pay?{query}", mandate: "upi://mandate?{query}" }, ios: { pay: "upi://pay?{query}", mandate: "upi://mandate?{query}" }, brand: { iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' }, verification: { status: "verified", sources: ["NPCI Linking Spec 1.6"], notes: "Generic UPI scheme as per NPCI specification" } }, { id: "gpay", label: "Google Pay", androidPackage: "com.google.android.apps.nbu.paisa.user", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end" }, ios: { pay: "gpay://upi/pay?{query}", mandate: "gpay://upi/mandate?{query}" }, stores: { play: "https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user", app: "https://apps.apple.com/in/app/google-pay-save-pay-manage/id1193357041" }, brand: { iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285f4" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>' }, verification: { status: "verified", sources: ["Chrome Intent doc", "Google Pay India iOS in-app payments doc"], notes: "Use gpay:// on iOS per official docs; treat legacy tez:// as deprecated alias if tests pass." } }, { id: "phonepe", label: "PhonePe", androidPackage: "com.phonepe.app", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.phonepe.app;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.phonepe.app;end" }, ios: { pay: "phonepe://pay?{query}", mandate: "phonepe://mandate?{query}" }, stores: { play: "https://play.google.com/store/apps/details?id=com.phonepe.app", app: "https://apps.apple.com/in/app/phonepe-upi-payments-recharge/id1170055821" }, brand: { iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#5f259f" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.59 2.24-1.33 2.79-.74.55-1.84.92-3.31.92-.81 0-1.49-.22-2-.66-.51-.44-.74-1.08-.74-1.91 0-.75.18-1.33.53-1.76.35-.43.84-.64 1.47-.64.51 0 .93.13 1.26.4.33.27.52.65.52 1.15 0 .4-.1.72-.29.97-.19.25-.45.37-.78.37-.25 0-.44-.06-.57-.18-.13-.12-.2-.29-.2-.51 0-.17.04-.3.12-.39.08-.09.18-.14.3-.14.09 0 .16.02.21.07.05.05.08.11.08.18 0 .05-.01.09-.04.12-.03.03-.07.04-.12.04-.03 0-.05-.01-.06-.02-.01-.01-.02-.02-.02-.04 0-.01.01-.02.02-.03.01-.01.02-.01.04-.01.01 0 .02 0 .02.01.01.01.01.01.01.02 0 .01-.01.02-.02.02-.01 0-.02-.01-.02-.02 0-.01.01-.01.02-.01.01 0 .02.01.02.02 0 .01-.01.02-.02.02-.01 0-.02-.01-.02-.02z"/></svg>' }, verification: { status: "community-observed", sources: ["PhonePe Dev portal (general)", "ecosystem references"], notes: "iOS scheme inferred from field usage; confirm via device smoke tests." } }, { id: "paytm", label: "Paytm", androidPackage: "net.one97.paytm", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=net.one97.paytm;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=net.one97.paytm;end" }, ios: { pay: "paytmmp://pay?{query}", mandate: "paytmmp://mandate?{query}" }, stores: { play: "https://play.google.com/store/apps/details?id=net.one97.paytm", app: "https://apps.apple.com/in/app/paytm-secure-upi-payments/id473941634" }, brand: { iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#002970" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>' }, verification: { status: "community-observed", sources: ["Paytm business docs (Smart Intent)", "ecosystem references"], notes: "Paytm deep link docs focus on SDK/Smart Intent; URL scheme unofficial publicly." } }, { id: "bhim", label: "BHIM", androidPackage: "in.org.npci.upiapp", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=in.org.npci.upiapp;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=in.org.npci.upiapp;end" }, ios: { pay: "bhim://upi/pay?{query}", mandate: "bhim://upi/mandate?{query}" }, stores: { play: "https://play.google.com/store/apps/details?id=in.org.npci.upiapp", app: "https://apps.apple.com/in/app/bhim-bharats-own-payments-app/id1200315258" }, brand: { iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#ff6600" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' }, verification: { status: "community-observed", sources: ["Store listings", "NPCI BHIM materials"], notes: "Normalize to single slash in path (avoid `upi//mandate`). Confirm via device tests." } }, { id: "amazonpay", label: "Amazon Pay UPI", androidPackage: "in.amazon.mShop.android.shopping", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=in.amazon.mShop.android.shopping;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=in.amazon.mShop.android.shopping;end" }, ios: { pay: "amzn://upi/pay?{query}", mandate: "amzn://upi/mandate?{query}" }, stores: { play: "https://play.google.com/store/apps/details?id=in.amazon.mShop.android.shopping", app: "https://apps.apple.com/in/app/amazon-india-shop-pay-movies/id660363563" }, brand: { iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#ff9900" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' }, verification: { status: "community-observed", sources: ["Amazon UPI help pages", "ecosystem observations"], notes: "Amazon does not publish a public UPI URL scheme; treat as tentative pending tests." } }, { id: "cred", label: "CRED", androidPackage: "com.dreamplug.androidapp", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.dreamplug.androidapp;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.dreamplug.androidapp;end" }, ios: { pay: "credpay://upi/pay?{query}", mandate: "credpay://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "navi", label: "Navi", androidPackage: "com.navi.navidotcom", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.navi.navidotcom;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.navi.navidotcom;end" }, ios: { pay: "navipay://upi/pay?{query}", mandate: "navipay://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "supermoney", label: "super.money", androidPackage: "com.hsb.super", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.hsb.super;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.hsb.super;end" }, ios: { pay: "super://upi/pay?{query}", mandate: "super://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "kotak", label: "Kotak Mahindra Bank", androidPackage: "com.msf.kbank.mobile", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.msf.kbank.mobile;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.msf.kbank.mobile;end" }, ios: { pay: "kmb://upi/pay?{query}", mandate: "kmb://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "hdfc", label: "HDFC Bank (PayZapp)", androidPackage: "com.hdfc.payzapp", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.hdfc.payzapp;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.hdfc.payzapp;end" }, ios: { pay: "payzapp://upi/pay?{query}", mandate: "payzapp://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "whatsapp", label: "WhatsApp", androidPackage: "com.whatsapp", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.whatsapp;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.whatsapp;end" }, ios: { pay: "whatsapp://upi/pay?{query}", mandate: "whatsapp://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "mobikwik", label: "MobiKwik", androidPackage: "com.mobikwik_new", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.mobikwik_new;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.mobikwik_new;end" }, ios: { pay: "mobikwik://upi/pay?{query}", mandate: "mobikwik://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "icici", label: "ICICI Bank (iMobile Pay)", androidPackage: "com.csam.icici.bank.imobile", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.csam.icici.bank.imobile;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.csam.icici.bank.imobile;end" }, ios: { pay: "imobile://upi/pay?{query}", mandate: "imobile://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "sbi", label: "SBI (YONO)", androidPackage: "com.sbi.lotusintouch", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.sbi.lotusintouch;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.sbi.lotusintouch;end" }, ios: { pay: "yono://upi/pay?{query}", mandate: "yono://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "axis", label: "Axis Bank", androidPackage: "com.upi.axispay", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.upi.axispay;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.upi.axispay;end" }, ios: { pay: "axispay://upi/pay?{query}", mandate: "axispay://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "slice", label: "Slice", androidPackage: "com.slice.pay", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.slice.pay;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.slice.pay;end" }, ios: { pay: "slicepay://upi/pay?{query}", mandate: "slicepay://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "idfcfirst", label: "IDFC First Bank", androidPackage: "com.idfcfirstbank.ifi", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.idfcfirstbank.ifi;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.idfcfirstbank.ifi;end" }, ios: { pay: "idfcfirstbank://upi/pay?{query}", mandate: "idfcfirstbank://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "jupiter", label: "Jupiter Money", androidPackage: "com.jupiter.money", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.jupiter.money;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.jupiter.money;end" }, ios: { pay: "jupiter://upi/pay?{query}", mandate: "jupiter://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "fampay", label: "FamPay", androidPackage: "in.fampay.app", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=in.fampay.app;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=in.fampay.app;end" }, ios: { pay: "in.fampay.app://upi/pay?{query}", mandate: "in.fampay.app://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "airtel", label: "Airtel Payments Bank", androidPackage: "com.myairtelapp", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.myairtelapp;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.myairtelapp;end" }, ios: { pay: "myairtel://upi/pay?{query}", mandate: "myairtel://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "kiwi", label: "Kiwi", androidPackage: "com.kiwi.bank", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.kiwi.bank;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.kiwi.bank;end" }, ios: { pay: "kiwi://upi/pay?{query}", mandate: "kiwi://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "shriramone", label: "Shriram One", androidPackage: "com.shriramone", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.shriramone;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.shriramone;end" }, ios: { pay: "shriramone://upi/pay?{query}", mandate: "shriramone://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "omnicard", label: "OmniCard", androidPackage: "com.omnicard", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.omnicard;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.omnicard;end" }, ios: { pay: "omnicard://upi/pay?{query}", mandate: "omnicard://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "freecharge", label: "FreeCharge", androidPackage: "com.freecharge", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.freecharge;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.freecharge;end" }, ios: { pay: "freecharge://upi/pay?{query}", mandate: "freecharge://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "tataneu", label: "Tata Neu", androidPackage: "com.tatadigital.neumoney", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.tatadigital.neumoney;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.tatadigital.neumoney;end" }, ios: { pay: "tnupi://upi/pay?{query}", mandate: "tnupi://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "indusind", label: "IndusInd Bank", androidPackage: "com.indusind.indusmobile", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.indusind.indusmobile;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.indusind.indusmobile;end" }, ios: { pay: "indusmobile://upi/pay?{query}", mandate: "indusmobile://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "bob", label: "Bank of Baroda", androidPackage: "com.bob.upi", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.bob.upi;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.bob.upi;end" }, ios: { pay: "bobupi://upi/pay?{query}", mandate: "bobupi://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "postpe", label: "BharatPe (PostPe)", androidPackage: "com.postpe.app", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.postpe.app;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.postpe.app;end" }, ios: { pay: "bharatpe://upi/pay?{query}", mandate: "bharatpe://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "simplypay", label: "SimplyPay UPI", androidPackage: "com.simplypay.upi", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.simplypay.upi;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.simplypay.upi;end" }, ios: { pay: "simplypayupi://upi/pay?{query}", mandate: "simplypayupi://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "onecard", label: "OneCard", androidPackage: "com.creditcard.onecard", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.creditcard.onecard;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.creditcard.onecard;end" }, ios: { pay: "onecard://upi/pay?{query}", mandate: "onecard://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "rbl", label: "RBL Bank", androidPackage: "com.rblbank.mobank", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.rblbank.mobank;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.rblbank.mobank;end" }, ios: { pay: "rbl://upi/pay?{query}", mandate: "rbl://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "dbs", label: "DBS Bank (digibank)", androidPackage: "com.dbs.in.digitalbank", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.dbs.in.digitalbank;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.dbs.in.digitalbank;end" }, ios: { pay: "dbin://upi/pay?{query}", mandate: "dbin://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "canara", label: "Canara Bank (ai1Pe)", androidPackage: "com.canarabhim.upiapp.mobility", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.canarabhim.upiapp.mobility;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.canarabhim.upiapp.mobility;end" }, ios: { pay: "canara://upi/pay?{query}", mandate: "canara://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "pnb", label: "Punjab National Bank", androidPackage: "com.pnb.upi", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.pnb.upi;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.pnb.upi;end" }, ios: { pay: "pnbupi://upi/pay?{query}", mandate: "pnbupi://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "jiopay", label: "Jio Payments Bank", androidPackage: "com.jio.myjio", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.jio.myjio;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.jio.myjio;end" }, ios: { pay: "myjio://upi/pay?{query}", mandate: "myjio://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "flipkart", label: "Flipkart UPI", androidPackage: "com.flipkart.android", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.flipkart.android;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.flipkart.android;end" }, ios: { pay: "flipkart://upi/pay?{query}", mandate: "flipkart://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }, { id: "fi", label: "Fi Money", androidPackage: "com.fi.money", android: { pay: "intent://pay?{query}#Intent;scheme=upi;package=com.fi.money;end", mandate: "intent://mandate?{query}#Intent;scheme=upi;package=com.fi.money;end" }, ios: { pay: "fi://upi/pay?{query}", mandate: "fi://upi/mandate?{query}" }, brand: { iconSvg: "" }, verification: { status: "community-observed", sources: ["ecosystem"] } }];

// src/data/registry.ts
function getAllApps() {
  return apps_default;
}
function getApp(appId) {
  return getAllApps().find((app) => app.id === appId);
}
function getVerifiedApps() {
  return getAllApps().filter((app) => app.verification.status === "verified");
}
function getAppsForPlatform(platform) {
  return getAllApps().filter((app) => {
    if (platform === "android") {
      return app.androidPackage || app.android;
    }
    return app.ios;
  });
}
function getAppLinkTemplate(appId, platform, action) {
  const app = getApp(appId);
  if (!app) {
    return;
  }
  return app[platform][action];
}
function getStoreUrl(appId, platform) {
  const app = getApp(appId);
  if (!app?.stores) {
    return;
  }
  if (platform === "android") {
    return app.stores.play;
  }
  return app.stores.app;
}
function isAppVerified(appId) {
  const app = getApp(appId);
  return app ? app.verification.status === "verified" : false;
}
function getAllAppIds() {
  return getAllApps().map((app) => app.id);
}
function getVerifiedAppIds() {
  return getVerifiedApps().map((app) => app.id);
}
function getDefaultAppIds() {
  const verified = getVerifiedAppIds();
  const popular = ["gpay", "phonepe", "paytm", "bhim", "cred", "whatsapp", "icici", "sbi", "axis", "mobikwik"];
  const defaultApps = [...new Set([...verified, ...popular])];
  const withoutGeneric = defaultApps.filter((id) => id !== "generic");
  const hasGeneric = defaultApps.includes("generic");
  return hasGeneric ? [...withoutGeneric, "generic"] : withoutGeneric;
}

// src/core/linkers.ts
function detectPlatform() {
  if (typeof navigator === "undefined") {
    return "android";
  }
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }
  return "android";
}
function buildAndroidIntentUrl(appId, upiQuery, action, fallbackUrl) {
  const app = getApp(appId);
  if (!app?.androidPackage) {
    return `upi://${action}?${upiQuery}`;
  }
  let intentUrl = `intent://${action}?${upiQuery}#Intent;scheme=upi;package=${app.androidPackage}`;
  if (fallbackUrl) {
    const encodedFallback = encodeURIComponent(fallbackUrl);
    intentUrl += `;S.browser_fallback_url=${encodedFallback}`;
  }
  intentUrl += ";end";
  return intentUrl;
}
function buildIosSchemeUrl(appId, upiQuery, action) {
  const template = getAppLinkTemplate(appId, "ios", action);
  if (!template) {
    return `upi://${action}?${upiQuery}`;
  }
  return template.replace("{query}", upiQuery);
}
function extractQueryFromUri(upiUri) {
  try {
    const parsed = parseUpiUri(upiUri);
    const params = new URLSearchParams;
    for (const [key, value] of Object.entries(parsed.params)) {
      if (value !== undefined && value !== "") {
        params.append(key, value);
      }
    }
    return params.toString();
  } catch (error) {
    throw new Error(`Invalid UPI URI: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
function buildAppLink(options) {
  const {
    appId,
    upiUri,
    upiParams,
    platform,
    action = "pay",
    fallbackUrl,
    includeFallback = true
  } = options;
  if (!upiUri && !upiParams) {
    throw new Error("Either upiUri or upiParams must be provided");
  }
  const app = getApp(appId);
  if (!app) {
    throw new Error(`Unknown app ID: ${appId}`);
  }
  let baseUri;
  if (upiUri) {
    baseUri = upiUri;
  } else if (upiParams) {
    baseUri = buildUpiUri(upiParams, action);
  } else {
    throw new Error("Either upiUri or upiParams must be provided");
  }
  const upiQuery = extractQueryFromUri(baseUri);
  let url;
  let resolvedFallbackUrl;
  if (platform === "android") {
    if (includeFallback) {
      resolvedFallbackUrl = fallbackUrl || getStoreUrl(appId, "android");
    }
    url = buildAndroidIntentUrl(appId, upiQuery, action, resolvedFallbackUrl);
  } else {
    url = buildIosSchemeUrl(appId, upiQuery, action);
    resolvedFallbackUrl = fallbackUrl || getStoreUrl(appId, "ios");
  }
  return {
    url,
    fallbackUrl: resolvedFallbackUrl,
    app: {
      id: appId,
      label: app.label,
      verified: app.verification.status === "verified"
    },
    platform,
    action
  };
}
function buildMultipleAppLinks(upiUri, appIds, platform, action = "pay") {
  const targetPlatform = platform || detectPlatform();
  return appIds.map((appId) => buildAppLink({
    appId,
    upiUri,
    platform: targetPlatform,
    action
  }));
}
function buildGenericUpiLink(upiParams, action = "pay") {
  return buildUpiUri(upiParams, action);
}
function supportsIntentUrls() {
  if (typeof navigator === "undefined") {
    return false;
  }
  const userAgent = navigator.userAgent.toLowerCase();
  return /android/.test(userAgent) && (/chrome|chromium/.test(userAgent) || /crios/.test(userAgent));
}
function getBestLinkStrategy() {
  const platform = detectPlatform();
  const supportsIntent = supportsIntentUrls();
  let recommendation;
  if (platform === "android" && supportsIntent) {
    recommendation = "intent";
  } else if (platform === "ios") {
    recommendation = "scheme";
  } else {
    recommendation = "generic";
  }
  return {
    platform,
    supportsIntent,
    recommendation
  };
}
// node_modules/qr-creator/dist/qr-creator.es6.min.js
var G = null;

class H {
}
H.render = function(w, B) {
  G(w, B);
};
self.QrCreator = H;
(function(w) {
  function B(t, c, a, e) {
    var b = {}, h = w(a, c);
    h.u(t);
    h.J();
    e = e || 0;
    var r = h.h(), d = h.h() + 2 * e;
    b.text = t;
    b.level = c;
    b.version = a;
    b.O = d;
    b.a = function(b2, a2) {
      b2 -= e;
      a2 -= e;
      return 0 > b2 || b2 >= r || 0 > a2 || a2 >= r ? false : h.a(b2, a2);
    };
    return b;
  }
  function C(t, c, a, e, b, h, r, d, g, x) {
    function u(b2, a2, f, c2, d2, r2, g2) {
      b2 ? (t.lineTo(a2 + r2, f + g2), t.arcTo(a2, f, c2, d2, h)) : t.lineTo(a2, f);
    }
    r ? t.moveTo(c + h, a) : t.moveTo(c, a);
    u(d, e, a, e, b, -h, 0);
    u(g, e, b, c, b, 0, -h);
    u(x, c, b, c, a, h, 0);
    u(r, c, a, e, a, 0, h);
  }
  function z(t, c, a, e, b, h, r, d, g, x) {
    function u(b2, a2, c2, d2) {
      t.moveTo(b2 + c2, a2);
      t.lineTo(b2, a2);
      t.lineTo(b2, a2 + d2);
      t.arcTo(b2, a2, b2 + c2, a2, h);
    }
    r && u(c, a, h, h);
    d && u(e, a, -h, h);
    g && u(e, b, -h, -h);
    x && u(c, b, h, -h);
  }
  function A(t, c) {
    var a = c.fill;
    if (typeof a === "string")
      t.fillStyle = a;
    else {
      var { type: e, colorStops: b } = a;
      a = a.position.map((b2) => Math.round(b2 * c.size));
      if (e === "linear-gradient")
        var h = t.createLinearGradient.apply(t, a);
      else if (e === "radial-gradient")
        h = t.createRadialGradient.apply(t, a);
      else
        throw Error("Unsupported fill");
      b.forEach(([b2, a2]) => {
        h.addColorStop(b2, a2);
      });
      t.fillStyle = h;
    }
  }
  function y(t, c) {
    a: {
      var { text: a, v: e, N: b, K: h, P: r } = c;
      b = Math.max(1, b || 1);
      for (h = Math.min(40, h || 40);b <= h; b += 1)
        try {
          var d = B(a, e, b, r);
          break a;
        } catch (J) {}
      d = undefined;
    }
    if (!d)
      return null;
    a = t.getContext("2d");
    c.background && (a.fillStyle = c.background, a.fillRect(c.left, c.top, c.size, c.size));
    e = d.O;
    h = c.size / e;
    a.beginPath();
    for (r = 0;r < e; r += 1)
      for (b = 0;b < e; b += 1) {
        var g = a, x = c.left + b * h, u = c.top + r * h, p = r, q = b, f = d.a, k = x + h, m = u + h, D = p - 1, E = p + 1, n = q - 1, l = q + 1, y2 = Math.floor(Math.min(0.5, Math.max(0, c.R)) * h), v2 = f(p, q), I = f(D, n), w2 = f(D, q);
        D = f(D, l);
        var F = f(p, l);
        l = f(E, l);
        q = f(E, q);
        E = f(E, n);
        p = f(p, n);
        x = Math.round(x);
        u = Math.round(u);
        k = Math.round(k);
        m = Math.round(m);
        v2 ? C(g, x, u, k, m, y2, !w2 && !p, !w2 && !F, !q && !F, !q && !p) : z(g, x, u, k, m, y2, w2 && p && I, w2 && F && D, q && F && l, q && p && E);
      }
    A(a, c);
    a.fill();
    return t;
  }
  var v = { minVersion: 1, maxVersion: 40, ecLevel: "L", left: 0, top: 0, size: 200, fill: "#000", background: null, text: "no text", radius: 0.5, quiet: 0 };
  G = function(t, c) {
    var a = {};
    Object.assign(a, v, t);
    a.N = a.minVersion;
    a.K = a.maxVersion;
    a.v = a.ecLevel;
    a.left = a.left;
    a.top = a.top;
    a.size = a.size;
    a.fill = a.fill;
    a.background = a.background;
    a.text = a.text;
    a.R = a.radius;
    a.P = a.quiet;
    if (c instanceof HTMLCanvasElement) {
      if (c.width !== a.size || c.height !== a.size)
        c.width = a.size, c.height = a.size;
      c.getContext("2d").clearRect(0, 0, c.width, c.height);
      y(c, a);
    } else
      t = document.createElement("canvas"), t.width = a.size, t.height = a.size, a = y(t, a), c.appendChild(a);
  };
})(function() {
  function w(c) {
    var a = C.s(c);
    return { S: function() {
      return 4;
    }, b: function() {
      return a.length;
    }, write: function(c2) {
      for (var b = 0;b < a.length; b += 1)
        c2.put(a[b], 8);
    } };
  }
  function B() {
    var c = [], a = 0, e = {
      B: function() {
        return c;
      },
      c: function(b) {
        return (c[Math.floor(b / 8)] >>> 7 - b % 8 & 1) == 1;
      },
      put: function(b, h) {
        for (var a2 = 0;a2 < h; a2 += 1)
          e.m((b >>> h - a2 - 1 & 1) == 1);
      },
      f: function() {
        return a;
      },
      m: function(b) {
        var h = Math.floor(a / 8);
        c.length <= h && c.push(0);
        b && (c[h] |= 128 >>> a % 8);
        a += 1;
      }
    };
    return e;
  }
  function C(c, a) {
    function e(b2, h2) {
      for (var a2 = -1;7 >= a2; a2 += 1)
        if (!(-1 >= b2 + a2 || d <= b2 + a2))
          for (var c2 = -1;7 >= c2; c2 += 1)
            -1 >= h2 + c2 || d <= h2 + c2 || (r[b2 + a2][h2 + c2] = 0 <= a2 && 6 >= a2 && (c2 == 0 || c2 == 6) || 0 <= c2 && 6 >= c2 && (a2 == 0 || a2 == 6) || 2 <= a2 && 4 >= a2 && 2 <= c2 && 4 >= c2 ? true : false);
    }
    function b(b2, a2) {
      for (var f = d = 4 * c + 17, k = Array(f), m = 0;m < f; m += 1) {
        k[m] = Array(f);
        for (var p = 0;p < f; p += 1)
          k[m][p] = null;
      }
      r = k;
      e(0, 0);
      e(d - 7, 0);
      e(0, d - 7);
      f = y.G(c);
      for (k = 0;k < f.length; k += 1)
        for (m = 0;m < f.length; m += 1) {
          p = f[k];
          var q = f[m];
          if (r[p][q] == null)
            for (var n = -2;2 >= n; n += 1)
              for (var l = -2;2 >= l; l += 1)
                r[p + n][q + l] = n == -2 || n == 2 || l == -2 || l == 2 || n == 0 && l == 0;
        }
      for (f = 8;f < d - 8; f += 1)
        r[f][6] == null && (r[f][6] = f % 2 == 0);
      for (f = 8;f < d - 8; f += 1)
        r[6][f] == null && (r[6][f] = f % 2 == 0);
      f = y.w(h << 3 | a2);
      for (k = 0;15 > k; k += 1)
        m = !b2 && (f >> k & 1) == 1, r[6 > k ? k : 8 > k ? k + 1 : d - 15 + k][8] = m, r[8][8 > k ? d - k - 1 : 9 > k ? 15 - k : 14 - k] = m;
      r[d - 8][8] = !b2;
      if (7 <= c) {
        f = y.A(c);
        for (k = 0;18 > k; k += 1)
          m = !b2 && (f >> k & 1) == 1, r[Math.floor(k / 3)][k % 3 + d - 8 - 3] = m;
        for (k = 0;18 > k; k += 1)
          m = !b2 && (f >> k & 1) == 1, r[k % 3 + d - 8 - 3][Math.floor(k / 3)] = m;
      }
      if (g == null) {
        b2 = t.I(c, h);
        f = B();
        for (k = 0;k < x.length; k += 1)
          m = x[k], f.put(4, 4), f.put(m.b(), y.f(4, c)), m.write(f);
        for (k = m = 0;k < b2.length; k += 1)
          m += b2[k].j;
        if (f.f() > 8 * m)
          throw Error("code length overflow. (" + f.f() + ">" + 8 * m + ")");
        for (f.f() + 4 <= 8 * m && f.put(0, 4);f.f() % 8 != 0; )
          f.m(false);
        for (;!(f.f() >= 8 * m); ) {
          f.put(236, 8);
          if (f.f() >= 8 * m)
            break;
          f.put(17, 8);
        }
        var u2 = 0;
        m = k = 0;
        p = Array(b2.length);
        q = Array(b2.length);
        for (n = 0;n < b2.length; n += 1) {
          var v2 = b2[n].j, w2 = b2[n].o - v2;
          k = Math.max(k, v2);
          m = Math.max(m, w2);
          p[n] = Array(v2);
          for (l = 0;l < p[n].length; l += 1)
            p[n][l] = 255 & f.B()[l + u2];
          u2 += v2;
          l = y.C(w2);
          v2 = z(p[n], l.b() - 1).l(l);
          q[n] = Array(l.b() - 1);
          for (l = 0;l < q[n].length; l += 1)
            w2 = l + v2.b() - q[n].length, q[n][l] = 0 <= w2 ? v2.c(w2) : 0;
        }
        for (l = f = 0;l < b2.length; l += 1)
          f += b2[l].o;
        f = Array(f);
        for (l = u2 = 0;l < k; l += 1)
          for (n = 0;n < b2.length; n += 1)
            l < p[n].length && (f[u2] = p[n][l], u2 += 1);
        for (l = 0;l < m; l += 1)
          for (n = 0;n < b2.length; n += 1)
            l < q[n].length && (f[u2] = q[n][l], u2 += 1);
        g = f;
      }
      b2 = g;
      f = -1;
      k = d - 1;
      m = 7;
      p = 0;
      a2 = y.F(a2);
      for (q = d - 1;0 < q; q -= 2)
        for (q == 6 && --q;; ) {
          for (n = 0;2 > n; n += 1)
            r[k][q - n] == null && (l = false, p < b2.length && (l = (b2[p] >>> m & 1) == 1), a2(k, q - n) && (l = !l), r[k][q - n] = l, --m, m == -1 && (p += 1, m = 7));
          k += f;
          if (0 > k || d <= k) {
            k -= f;
            f = -f;
            break;
          }
        }
    }
    var h = A[a], r = null, d = 0, g = null, x = [], u = { u: function(b2) {
      b2 = w(b2);
      x.push(b2);
      g = null;
    }, a: function(b2, a2) {
      if (0 > b2 || d <= b2 || 0 > a2 || d <= a2)
        throw Error(b2 + "," + a2);
      return r[b2][a2];
    }, h: function() {
      return d;
    }, J: function() {
      for (var a2 = 0, h2 = 0, c2 = 0;8 > c2; c2 += 1) {
        b(true, c2);
        var d2 = y.D(u);
        if (c2 == 0 || a2 > d2)
          a2 = d2, h2 = c2;
      }
      b(false, h2);
    } };
    return u;
  }
  function z(c, a) {
    if (typeof c.length == "undefined")
      throw Error(c.length + "/" + a);
    var e = function() {
      for (var b2 = 0;b2 < c.length && c[b2] == 0; )
        b2 += 1;
      for (var r = Array(c.length - b2 + a), d = 0;d < c.length - b2; d += 1)
        r[d] = c[d + b2];
      return r;
    }(), b = { c: function(b2) {
      return e[b2];
    }, b: function() {
      return e.length;
    }, multiply: function(a2) {
      for (var h = Array(b.b() + a2.b() - 1), c2 = 0;c2 < b.b(); c2 += 1)
        for (var g = 0;g < a2.b(); g += 1)
          h[c2 + g] ^= v.i(v.g(b.c(c2)) + v.g(a2.c(g)));
      return z(h, 0);
    }, l: function(a2) {
      if (0 > b.b() - a2.b())
        return b;
      for (var c2 = v.g(b.c(0)) - v.g(a2.c(0)), h = Array(b.b()), g = 0;g < b.b(); g += 1)
        h[g] = b.c(g);
      for (g = 0;g < a2.b(); g += 1)
        h[g] ^= v.i(v.g(a2.c(g)) + c2);
      return z(h, 0).l(a2);
    } };
    return b;
  }
  C.s = function(c) {
    for (var a = [], e = 0;e < c.length; e++) {
      var b = c.charCodeAt(e);
      128 > b ? a.push(b) : 2048 > b ? a.push(192 | b >> 6, 128 | b & 63) : 55296 > b || 57344 <= b ? a.push(224 | b >> 12, 128 | b >> 6 & 63, 128 | b & 63) : (e++, b = 65536 + ((b & 1023) << 10 | c.charCodeAt(e) & 1023), a.push(240 | b >> 18, 128 | b >> 12 & 63, 128 | b >> 6 & 63, 128 | b & 63));
    }
    return a;
  };
  var A = { L: 1, M: 0, Q: 3, H: 2 }, y = function() {
    function c(b) {
      for (var a2 = 0;b != 0; )
        a2 += 1, b >>>= 1;
      return a2;
    }
    var a = [
      [],
      [6, 18],
      [6, 22],
      [6, 26],
      [6, 30],
      [6, 34],
      [6, 22, 38],
      [6, 24, 42],
      [6, 26, 46],
      [6, 28, 50],
      [6, 30, 54],
      [6, 32, 58],
      [6, 34, 62],
      [6, 26, 46, 66],
      [6, 26, 48, 70],
      [6, 26, 50, 74],
      [6, 30, 54, 78],
      [6, 30, 56, 82],
      [6, 30, 58, 86],
      [6, 34, 62, 90],
      [6, 28, 50, 72, 94],
      [6, 26, 50, 74, 98],
      [6, 30, 54, 78, 102],
      [6, 28, 54, 80, 106],
      [6, 32, 58, 84, 110],
      [6, 30, 58, 86, 114],
      [6, 34, 62, 90, 118],
      [6, 26, 50, 74, 98, 122],
      [6, 30, 54, 78, 102, 126],
      [6, 26, 52, 78, 104, 130],
      [6, 30, 56, 82, 108, 134],
      [6, 34, 60, 86, 112, 138],
      [6, 30, 58, 86, 114, 142],
      [6, 34, 62, 90, 118, 146],
      [6, 30, 54, 78, 102, 126, 150],
      [6, 24, 50, 76, 102, 128, 154],
      [6, 28, 54, 80, 106, 132, 158],
      [6, 32, 58, 84, 110, 136, 162],
      [6, 26, 54, 82, 110, 138, 166],
      [6, 30, 58, 86, 114, 142, 170]
    ], e = { w: function(b) {
      for (var a2 = b << 10;0 <= c(a2) - c(1335); )
        a2 ^= 1335 << c(a2) - c(1335);
      return (b << 10 | a2) ^ 21522;
    }, A: function(b) {
      for (var a2 = b << 12;0 <= c(a2) - c(7973); )
        a2 ^= 7973 << c(a2) - c(7973);
      return b << 12 | a2;
    }, G: function(b) {
      return a[b - 1];
    }, F: function(b) {
      switch (b) {
        case 0:
          return function(b2, a2) {
            return (b2 + a2) % 2 == 0;
          };
        case 1:
          return function(b2) {
            return b2 % 2 == 0;
          };
        case 2:
          return function(b2, a2) {
            return a2 % 3 == 0;
          };
        case 3:
          return function(b2, a2) {
            return (b2 + a2) % 3 == 0;
          };
        case 4:
          return function(b2, a2) {
            return (Math.floor(b2 / 2) + Math.floor(a2 / 3)) % 2 == 0;
          };
        case 5:
          return function(b2, a2) {
            return b2 * a2 % 2 + b2 * a2 % 3 == 0;
          };
        case 6:
          return function(b2, a2) {
            return (b2 * a2 % 2 + b2 * a2 % 3) % 2 == 0;
          };
        case 7:
          return function(b2, a2) {
            return (b2 * a2 % 3 + (b2 + a2) % 2) % 2 == 0;
          };
        default:
          throw Error("bad maskPattern:" + b);
      }
    }, C: function(b) {
      for (var a2 = z([1], 0), c2 = 0;c2 < b; c2 += 1)
        a2 = a2.multiply(z([1, v.i(c2)], 0));
      return a2;
    }, f: function(b, a2) {
      if (b != 4 || 1 > a2 || 40 < a2)
        throw Error("mode: " + b + "; type: " + a2);
      return 10 > a2 ? 8 : 16;
    }, D: function(b) {
      for (var a2 = b.h(), c2 = 0, d = 0;d < a2; d += 1)
        for (var g = 0;g < a2; g += 1) {
          for (var e2 = 0, t2 = b.a(d, g), p = -1;1 >= p; p += 1)
            if (!(0 > d + p || a2 <= d + p))
              for (var q = -1;1 >= q; q += 1)
                0 > g + q || a2 <= g + q || (p != 0 || q != 0) && t2 == b.a(d + p, g + q) && (e2 += 1);
          5 < e2 && (c2 += 3 + e2 - 5);
        }
      for (d = 0;d < a2 - 1; d += 1)
        for (g = 0;g < a2 - 1; g += 1)
          if (e2 = 0, b.a(d, g) && (e2 += 1), b.a(d + 1, g) && (e2 += 1), b.a(d, g + 1) && (e2 += 1), b.a(d + 1, g + 1) && (e2 += 1), e2 == 0 || e2 == 4)
            c2 += 3;
      for (d = 0;d < a2; d += 1)
        for (g = 0;g < a2 - 6; g += 1)
          b.a(d, g) && !b.a(d, g + 1) && b.a(d, g + 2) && b.a(d, g + 3) && b.a(d, g + 4) && !b.a(d, g + 5) && b.a(d, g + 6) && (c2 += 40);
      for (g = 0;g < a2; g += 1)
        for (d = 0;d < a2 - 6; d += 1)
          b.a(d, g) && !b.a(d + 1, g) && b.a(d + 2, g) && b.a(d + 3, g) && b.a(d + 4, g) && !b.a(d + 5, g) && b.a(d + 6, g) && (c2 += 40);
      for (g = e2 = 0;g < a2; g += 1)
        for (d = 0;d < a2; d += 1)
          b.a(d, g) && (e2 += 1);
      return c2 += Math.abs(100 * e2 / a2 / a2 - 50) / 5 * 10;
    } };
    return e;
  }(), v = function() {
    for (var c = Array(256), a = Array(256), e = 0;8 > e; e += 1)
      c[e] = 1 << e;
    for (e = 8;256 > e; e += 1)
      c[e] = c[e - 4] ^ c[e - 5] ^ c[e - 6] ^ c[e - 8];
    for (e = 0;255 > e; e += 1)
      a[c[e]] = e;
    return { g: function(b) {
      if (1 > b)
        throw Error("glog(" + b + ")");
      return a[b];
    }, i: function(b) {
      for (;0 > b; )
        b += 255;
      for (;256 <= b; )
        b -= 255;
      return c[b];
    } };
  }(), t = function() {
    function c(b, c2) {
      switch (c2) {
        case A.L:
          return a[4 * (b - 1)];
        case A.M:
          return a[4 * (b - 1) + 1];
        case A.Q:
          return a[4 * (b - 1) + 2];
        case A.H:
          return a[4 * (b - 1) + 3];
      }
    }
    var a = [
      [1, 26, 19],
      [1, 26, 16],
      [1, 26, 13],
      [1, 26, 9],
      [1, 44, 34],
      [1, 44, 28],
      [1, 44, 22],
      [1, 44, 16],
      [1, 70, 55],
      [1, 70, 44],
      [2, 35, 17],
      [2, 35, 13],
      [1, 100, 80],
      [2, 50, 32],
      [2, 50, 24],
      [4, 25, 9],
      [1, 134, 108],
      [2, 67, 43],
      [2, 33, 15, 2, 34, 16],
      [2, 33, 11, 2, 34, 12],
      [2, 86, 68],
      [4, 43, 27],
      [4, 43, 19],
      [4, 43, 15],
      [2, 98, 78],
      [4, 49, 31],
      [2, 32, 14, 4, 33, 15],
      [4, 39, 13, 1, 40, 14],
      [2, 121, 97],
      [2, 60, 38, 2, 61, 39],
      [4, 40, 18, 2, 41, 19],
      [4, 40, 14, 2, 41, 15],
      [2, 146, 116],
      [
        3,
        58,
        36,
        2,
        59,
        37
      ],
      [4, 36, 16, 4, 37, 17],
      [4, 36, 12, 4, 37, 13],
      [2, 86, 68, 2, 87, 69],
      [4, 69, 43, 1, 70, 44],
      [6, 43, 19, 2, 44, 20],
      [6, 43, 15, 2, 44, 16],
      [4, 101, 81],
      [1, 80, 50, 4, 81, 51],
      [4, 50, 22, 4, 51, 23],
      [3, 36, 12, 8, 37, 13],
      [2, 116, 92, 2, 117, 93],
      [6, 58, 36, 2, 59, 37],
      [4, 46, 20, 6, 47, 21],
      [7, 42, 14, 4, 43, 15],
      [4, 133, 107],
      [8, 59, 37, 1, 60, 38],
      [8, 44, 20, 4, 45, 21],
      [12, 33, 11, 4, 34, 12],
      [3, 145, 115, 1, 146, 116],
      [4, 64, 40, 5, 65, 41],
      [11, 36, 16, 5, 37, 17],
      [11, 36, 12, 5, 37, 13],
      [5, 109, 87, 1, 110, 88],
      [5, 65, 41, 5, 66, 42],
      [5, 54, 24, 7, 55, 25],
      [11, 36, 12, 7, 37, 13],
      [5, 122, 98, 1, 123, 99],
      [
        7,
        73,
        45,
        3,
        74,
        46
      ],
      [15, 43, 19, 2, 44, 20],
      [3, 45, 15, 13, 46, 16],
      [1, 135, 107, 5, 136, 108],
      [10, 74, 46, 1, 75, 47],
      [1, 50, 22, 15, 51, 23],
      [2, 42, 14, 17, 43, 15],
      [5, 150, 120, 1, 151, 121],
      [9, 69, 43, 4, 70, 44],
      [17, 50, 22, 1, 51, 23],
      [2, 42, 14, 19, 43, 15],
      [3, 141, 113, 4, 142, 114],
      [3, 70, 44, 11, 71, 45],
      [17, 47, 21, 4, 48, 22],
      [9, 39, 13, 16, 40, 14],
      [3, 135, 107, 5, 136, 108],
      [3, 67, 41, 13, 68, 42],
      [15, 54, 24, 5, 55, 25],
      [15, 43, 15, 10, 44, 16],
      [4, 144, 116, 4, 145, 117],
      [17, 68, 42],
      [17, 50, 22, 6, 51, 23],
      [19, 46, 16, 6, 47, 17],
      [2, 139, 111, 7, 140, 112],
      [17, 74, 46],
      [7, 54, 24, 16, 55, 25],
      [34, 37, 13],
      [
        4,
        151,
        121,
        5,
        152,
        122
      ],
      [4, 75, 47, 14, 76, 48],
      [11, 54, 24, 14, 55, 25],
      [16, 45, 15, 14, 46, 16],
      [6, 147, 117, 4, 148, 118],
      [6, 73, 45, 14, 74, 46],
      [11, 54, 24, 16, 55, 25],
      [30, 46, 16, 2, 47, 17],
      [8, 132, 106, 4, 133, 107],
      [8, 75, 47, 13, 76, 48],
      [7, 54, 24, 22, 55, 25],
      [22, 45, 15, 13, 46, 16],
      [10, 142, 114, 2, 143, 115],
      [19, 74, 46, 4, 75, 47],
      [28, 50, 22, 6, 51, 23],
      [33, 46, 16, 4, 47, 17],
      [8, 152, 122, 4, 153, 123],
      [22, 73, 45, 3, 74, 46],
      [8, 53, 23, 26, 54, 24],
      [12, 45, 15, 28, 46, 16],
      [3, 147, 117, 10, 148, 118],
      [3, 73, 45, 23, 74, 46],
      [4, 54, 24, 31, 55, 25],
      [11, 45, 15, 31, 46, 16],
      [7, 146, 116, 7, 147, 117],
      [21, 73, 45, 7, 74, 46],
      [1, 53, 23, 37, 54, 24],
      [19, 45, 15, 26, 46, 16],
      [5, 145, 115, 10, 146, 116],
      [19, 75, 47, 10, 76, 48],
      [15, 54, 24, 25, 55, 25],
      [23, 45, 15, 25, 46, 16],
      [13, 145, 115, 3, 146, 116],
      [2, 74, 46, 29, 75, 47],
      [42, 54, 24, 1, 55, 25],
      [23, 45, 15, 28, 46, 16],
      [17, 145, 115],
      [10, 74, 46, 23, 75, 47],
      [10, 54, 24, 35, 55, 25],
      [19, 45, 15, 35, 46, 16],
      [17, 145, 115, 1, 146, 116],
      [14, 74, 46, 21, 75, 47],
      [29, 54, 24, 19, 55, 25],
      [11, 45, 15, 46, 46, 16],
      [13, 145, 115, 6, 146, 116],
      [14, 74, 46, 23, 75, 47],
      [44, 54, 24, 7, 55, 25],
      [59, 46, 16, 1, 47, 17],
      [12, 151, 121, 7, 152, 122],
      [12, 75, 47, 26, 76, 48],
      [39, 54, 24, 14, 55, 25],
      [22, 45, 15, 41, 46, 16],
      [6, 151, 121, 14, 152, 122],
      [6, 75, 47, 34, 76, 48],
      [46, 54, 24, 10, 55, 25],
      [2, 45, 15, 64, 46, 16],
      [17, 152, 122, 4, 153, 123],
      [29, 74, 46, 14, 75, 47],
      [49, 54, 24, 10, 55, 25],
      [24, 45, 15, 46, 46, 16],
      [4, 152, 122, 18, 153, 123],
      [13, 74, 46, 32, 75, 47],
      [48, 54, 24, 14, 55, 25],
      [42, 45, 15, 32, 46, 16],
      [20, 147, 117, 4, 148, 118],
      [40, 75, 47, 7, 76, 48],
      [43, 54, 24, 22, 55, 25],
      [10, 45, 15, 67, 46, 16],
      [19, 148, 118, 6, 149, 119],
      [18, 75, 47, 31, 76, 48],
      [34, 54, 24, 34, 55, 25],
      [20, 45, 15, 61, 46, 16]
    ], e = { I: function(b, a2) {
      var e2 = c(b, a2);
      if (typeof e2 == "undefined")
        throw Error("bad rs block @ typeNumber:" + b + "/errorCorrectLevel:" + a2);
      b = e2.length / 3;
      a2 = [];
      for (var d = 0;d < b; d += 1)
        for (var g = e2[3 * d], h = e2[3 * d + 1], t2 = e2[3 * d + 2], p = 0;p < g; p += 1) {
          var q = t2, f = {};
          f.o = h;
          f.j = q;
          a2.push(f);
        }
      return a2;
    } };
    return e;
  }();
  return C;
}());
var qr_creator_es6_min_default = QrCreator;

// src/qr/encoder.ts
function generateQRCode(upiUri, options = {}) {
  const {
    size = 200,
    errorCorrectionLevel = "M",
    backgroundColor = null,
    foregroundColor = "#000000",
    radius = 0
  } = options;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  qr_creator_es6_min_default.render({
    text: upiUri,
    radius,
    ecLevel: errorCorrectionLevel,
    fill: foregroundColor,
    background: backgroundColor,
    size
  }, canvas);
  const dataUrl = canvas.toDataURL("image/png");
  const svgContainer = document.createElement("div");
  qr_creator_es6_min_default.render({
    text: upiUri,
    radius,
    ecLevel: errorCorrectionLevel,
    fill: foregroundColor,
    background: backgroundColor || "transparent",
    size
  }, svgContainer);
  const svgElement = svgContainer.querySelector("svg");
  const svgString = svgElement ? svgElement.outerHTML : "";
  return {
    dataUrl,
    svg: svgString,
    text: upiUri,
    size
  };
}
function generateQRCanvas(upiUri, options = {}) {
  if (typeof document === "undefined") {
    return null;
  }
  const {
    size = 200,
    errorCorrectionLevel = "M",
    backgroundColor = null,
    foregroundColor = "#000000",
    radius = 0
  } = options;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  qr_creator_es6_min_default.render({
    text: upiUri,
    radius,
    ecLevel: errorCorrectionLevel,
    fill: foregroundColor,
    background: backgroundColor,
    size
  }, canvas);
  return canvas;
}
function downloadQRCode(upiUri, filename = "upi-payment-qr.png", options = {}) {
  const canvas = generateQRCanvas(upiUri, options);
  if (!canvas)
    return;
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
export {
  validateUpiParams,
  supportsIntentUrls,
  parseUpiUri,
  isAppVerified,
  getVerifiedApps,
  getVerifiedAppIds,
  getStoreUrl,
  getDefaultAppIds,
  getBestLinkStrategy,
  getAppsForPlatform,
  getAppLinkTemplate,
  getApp,
  getAllApps,
  getAllAppIds,
  generateQRCode,
  generateQRCanvas,
  downloadQRCode,
  detectPlatform,
  createPaymentUri,
  createMandateUri,
  buildUpiUri,
  buildMultipleAppLinks,
  buildGenericUpiLink,
  buildAppLink,
  apps_default as appsData
};
