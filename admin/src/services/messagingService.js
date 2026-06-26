import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const SMS_SETTINGS_DOC = 'smsSettings';

const defaultSmsSettings = {
  apiUrl: '',
  apiKey: '',
  senderId: '',
  msgReceived: 'প্রিয় {CustomerName}, আপনার {DeviceType} টি মেরামতের জন্য জমা নেওয়া হয়েছে। সম্ভাব্য খরচ: {TotalBill} টাকা। ধন্যবাদ!',
  msgReady: 'প্রিয় {CustomerName}, আপনার {DeviceType} এর মেরামত সম্পন্ন হয়েছে। বকেয়া বিল: {DueBalance} টাকা। অনুগ্রহ করে সংগ্রহ করে নিন।',
  msgDelivered: 'প্রিয় {CustomerName}, আমাদের সেবা গ্রহণ করার জন্য ধন্যবাদ! আপনার {DeviceType} টি ডেলিভারি করা হয়েছে। মোট জমা: {TotalPaid} টাকা।',
  msgCancelled: 'প্রিয় {CustomerName}, দুঃখিত! কোনো কারণে আপনার {DeviceType} এর মেরামতটি বাতিল করা হয়েছে। অনুগ্রহ করে ডিভাইসটি সংগ্রহ করে নিন।'
};

export const getSmsSettings = async () => {
  try {
    const docRef = doc(db, 'settings', SMS_SETTINGS_DOC);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...defaultSmsSettings, ...docSnap.data() };
    } else {
      await setDoc(docRef, defaultSmsSettings);
      return defaultSmsSettings;
    }
  } catch (error) {
    console.error("Error fetching SMS settings:", error);
    return defaultSmsSettings;
  }
};

export const updateSmsSettings = async (settings) => {
  try {
    const docRef = doc(db, 'settings', SMS_SETTINGS_DOC);
    await setDoc(docRef, settings, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating SMS settings:", error);
    throw error;
  }
};

const replaceVariables = (template, customer) => {
  if (!template) return '';
  return template
    .replace(/{CustomerName}/g, customer.name || '')
    .replace(/{DeviceType}/g, customer.deviceType || '')
    .replace(/{Brand}/g, customer.brand || '')
    .replace(/{Problem}/g, customer.issue || '')
    .replace(/{TotalBill}/g, customer.estCost || customer.totalBill || '0')
    .replace(/{DueBalance}/g, customer.dueBalance || '0')
    .replace(/{TotalPaid}/g, customer.advance || '0');
};

export const sendSMS = async (phone, message, settings) => {
  if (!settings.apiUrl || !phone) {
    console.log("SMS API URL or phone is missing.");
    return false;
  }

  // Format phone number to ensure it starts with 880 for BD (if not already)
  let formattedPhone = phone;
  if (formattedPhone.startsWith('01')) {
    formattedPhone = '88' + formattedPhone;
  } else if (formattedPhone.startsWith('+880')) {
    formattedPhone = formattedPhone.replace('+', '');
  }

  try {
    // This is a generic GET request format commonly used by BD SMS gateways (e.g., BulkSMSBD, GreenWebSMS)
    // Example: http://api.bulksmsbd.com/api/smsapi?api_key=XXX&type=text&number=8801XXX&senderid=XXX&message=Hello
    
    // Clean up the base URL if the user pasted the entire example URL
    let baseUrl = settings.apiUrl.split('?')[0]; 
    if (!baseUrl) baseUrl = 'https://bulksmsbd.net/api/smsapi'; // Fallback
    
    // Enforce HTTPS to prevent mixed-content blocking on live site
    if (baseUrl.startsWith('http://')) {
      baseUrl = baseUrl.replace('http://', 'https://');
    }

    // Auto-extract API key if user pasted the full URL in the API URL field
    let extractedApiKey = settings.apiKey;
    if (!extractedApiKey && settings.apiUrl.includes('api_key=')) {
      const urlParams = new URLSearchParams(settings.apiUrl.split('?')[1]);
      extractedApiKey = urlParams.get('api_key');
    }

    if (!extractedApiKey) {
      console.log("No API Key found");
      return false;
    }

    // Build the query string specifically for BulkSMSBD
    const params = new URLSearchParams({
      api_key: extractedApiKey,
      type: 'unicode', // Changed to unicode for Bengali characters
      number: formattedPhone,
      senderid: settings.senderId || '8809648909194',
      message: message
    });

    const requestUrl = `${baseUrl}?${params.toString()}`;

    // Use mode: 'no-cors' if the API doesn't support CORS from the browser
    const response = await fetch(requestUrl, {
      method: 'GET',
      mode: 'no-cors' 
    });
    
    console.log("SMS Triggered successfully to:", formattedPhone);
    return true;
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return false;
  }
};

export const triggerAutomation = async (customer, eventType) => {
  try {
    const settings = await getSmsSettings();
    if (!settings.apiUrl) return; // Silent skip if not configured
    
    let template = '';
    if (eventType === 'received') template = settings.msgReceived;
    else if (eventType === 'ready') template = settings.msgReady;
    else if (eventType === 'delivered') template = settings.msgDelivered;
    else if (eventType === 'cancelled') template = settings.msgCancelled;

    if (!template) return;

    const finalMessage = replaceVariables(template, customer);
    await sendSMS(customer.phone, finalMessage, settings);
    
  } catch (error) {
    console.error("Automation Trigger Error:", error);
  }
};
