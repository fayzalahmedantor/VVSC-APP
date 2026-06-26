import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const SMS_SETTINGS_DOC = 'smsSettings';

const defaultSmsSettings = {
  apiUrl: '',
  apiKey: '',
  senderId: '',
  templateReceived: 'Dear {CustomerName}, your device {DeviceType} has been received for repair. Estimated cost: {TotalBill} Tk. Thank you!',
  templateReady: 'Dear {CustomerName}, your {DeviceType} repair is complete and ready for delivery. Due balance: {DueBalance} Tk.',
  templateDelivered: 'Dear {CustomerName}, thank you for choosing us! Your {DeviceType} has been delivered. Total Paid: {TotalPaid} Tk.'
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
  if (!settings.apiUrl || !settings.apiKey || !phone) {
    console.log("SMS API not configured properly or phone is missing.");
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
    if (!baseUrl) baseUrl = 'http://bulksmsbd.net/api/smsapi'; // Fallback

    // Build the query string specifically for BulkSMSBD
    const params = new URLSearchParams({
      api_key: settings.apiKey,
      type: 'text',
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
    if (eventType === 'received') template = settings.templateReceived;
    else if (eventType === 'ready') template = settings.templateReady;
    else if (eventType === 'delivered') template = settings.templateDelivered;

    if (!template) return;

    const finalMessage = replaceVariables(template, customer);
    await sendSMS(customer.phone, finalMessage, settings);
    
  } catch (error) {
    console.error("Automation Trigger Error:", error);
  }
};
