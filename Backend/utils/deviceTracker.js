const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

/**
 * Extract device information from user agent string
 * @param {string} userAgent - User agent string from request headers
 * @returns {object} Device information object
 */
const extractDeviceInfo = (userAgent) => {
  if (!userAgent) {
    return {
      browser: { name: null, version: null },
      os: { name: null, version: null },
      device: { type: null, vendor: null, model: null },
      user_agent: null
    };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    browser: {
      name: result.browser.name || null,
      version: result.browser.version || null
    },
    os: {
      name: result.os.name || null,
      version: result.os.version || null
    },
    device: {
      type: result.device.type || 'desktop', // default to desktop if not detected
      vendor: result.device.vendor || null,
      model: result.device.model || null
    },
    user_agent: userAgent
  };
};

/**
 * Get location information from IP address
 * @param {string} ipAddress - IP address to lookup
 * @returns {object} Location information object
 */
const getLocationFromIP = (ipAddress) => {
  if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
    return {
      country: 'Local',
      region: 'Local',
      city: 'Local',
      timezone: null,
      latitude: null,
      longitude: null,
      isp: 'Local Network'
    };
  }

  const geo = geoip.lookup(ipAddress);
  
  if (!geo) {
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      timezone: null,
      latitude: null,
      longitude: null,
      isp: 'Unknown'
    };
  }

  return {
    country: geo.country || 'Unknown',
    region: geo.region || 'Unknown',
    city: geo.city || 'Unknown',
    timezone: geo.timezone || null,
    latitude: geo.ll ? geo.ll[0] : null,
    longitude: geo.ll ? geo.ll[1] : null,
    isp: 'Unknown' // geoip-lite doesn't provide ISP info
  };
};

/**
 * Extract real IP address from request
 * @param {object} req - Express request object
 * @returns {string} Real IP address
 */
const extractRealIP = (req) => {
  // Check various headers for real IP (in order of preference)
  const possibleHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'x-cluster-client-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded'
  ];

  for (const header of possibleHeaders) {
    const value = req.headers[header];
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ip = value.split(',')[0].trim();
      if (ip && ip !== 'unknown') {
        return ip;
      }
    }
  }

  // Fallback to connection remote address
  return req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.connection?.socket?.remoteAddress ||
         req.ip ||
         '127.0.0.1';
};

/**
 * Get device and location information from request
 * @param {object} req - Express request object
 * @returns {object} Combined device and location information
 */
const getDeviceAndLocationInfo = async (req) => {
  const ipAddress = extractRealIP(req);
  const userAgent = req.headers['user-agent'];
  
  const deviceInfo = extractDeviceInfo(userAgent);
  
  // Check if location data is provided from frontend
  let locationInfo;
  if (req.body && req.body.current_location) {
    // Use location data from frontend
    locationInfo = {
      country: req.body.current_location.country || 'Unknown',
      region: req.body.current_location.state || 'Unknown',
      city: req.body.current_location.city || 'Unknown',
      timezone: null,
      latitude: req.body.current_location.latitude || null,
      longitude: req.body.current_location.longitude || null,
      isp: 'Unknown'
    };
  } else {
    // Fallback to IP-based location
    locationInfo = getLocationFromIP(ipAddress);
  }
  
  return {
    ip_address: ipAddress,
    device_info: deviceInfo,
    location: locationInfo
  };
};

/**
 * Check if two device infos represent the same device
 * @param {object} device1 - First device info
 * @param {object} device2 - Second device info
 * @returns {boolean} True if same device
 */
const isSameDevice = (device1, device2) => {
  if (!device1 || !device2) return false;

  // Compare browser and OS
  const sameBrowser = device1.browser?.name === device2.browser?.name;
  const sameOS = device1.os?.name === device2.os?.name;
  const sameDeviceType = device1.device?.type === device2.device?.type;

  return sameBrowser && sameOS && sameDeviceType;
};

/**
 * Check if two locations are significantly different
 * @param {object} location1 - First location info
 * @param {object} location2 - Second location info
 * @returns {boolean} True if locations are different
 */
const isDifferentLocation = (location1, location2) => {
  if (!location1 || !location2) return true;

  // If countries are different, definitely different location
  if (location1.country !== location2.country) return true;

  // If cities are different, consider it different
  if (location1.city !== location2.city) return true;

  return false;
};

module.exports = {
  extractDeviceInfo,
  getLocationFromIP,
  extractRealIP,
  getDeviceAndLocationInfo,
  isSameDevice,
  isDifferentLocation
};