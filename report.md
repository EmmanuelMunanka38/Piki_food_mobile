# ZUP Services Architecture Report

## Overview
The ZUP application is a food delivery platform built with React Native and Expo. The services layer handles all backend communication, real-time updates, location tracking, and third-party integrations. This report documents the current state of all services in the system.

---

## Service Inventory

### 1. Tracking Service (tracking.service.ts)
**Purpose**: Manages real-time order tracking and driver location updates

**Key Features**:
- WebSocket-based connection to backend using Socket.IO
- Real-time driver location streaming
- Order status updates and transformations
- Multiple listener support for tracking updates and connection changes

**Status Tracking Workflow**:
The service maintains a complete order lifecycle with the following statuses in sequence:
1. Restaurant Confirmed - Initial status when restaurant accepts order
2. Preparing Order - Order is being prepared
3. Driver Assigned - Driver has been assigned to the order
4. Driver Arriving - Driver is arriving at restaurant
5. Picked Up - Order has been picked up from restaurant
6. On the Way - Order is in transit to customer
7. Delivered - Order has been delivered

**Socket Events Handled**:
- `connect` - Connection established, emits track:order event
- `disconnect` - Connection lost
- `driver:location` - Receives driver location data with real-time coordinates
- `order:status` - Receives order status updates with automatic translation from backend status values

**Data Structure**: TrackingUpdate contains:
- orderId: Order identifier
- status: Current order status
- estimatedMinutes: Remaining delivery time (decrements automatically)
- estimatedArrival: Formatted arrival time
- driverLocation: Driver coordinates with heading and speed
- timestamp: Update timestamp

**Connection Management**:
- Auto-reconnect enabled with 10 attempts and 3 second delays
- Dual transport support (WebSocket and polling fallback)
- Authentication via JWT token from auth store
- Automatic status label mapping for UI display

---

### 2. Authentication Service (auth.service.ts)
**Purpose**: Handles user authentication and profile management

**Key Operations**:
- `sendOtp()` - Sends OTP to email and phone for verification
- `verifyOTP()` - Verifies OTP code and returns user data with tokens
- `refreshToken()` - Renews access token using refresh token
- `getProfile()` - Fetches current user profile information
- `updateProfile()` - Updates user name, email, or avatar
- `logout()` - Logs out user and clears session (non-critical, errors are caught)

**Authentication Flow**:
1. User initiates login with email and phone
2. Backend sends OTP to provided contact details
3. User enters OTP and optional name/role
4. Backend verifies OTP and returns JWT tokens and user data
5. Tokens stored in auth store for subsequent requests

**Token Management**:
- Supports both access and refresh tokens
- Refresh tokens automatically handled by API layer
- Optional role parameter for different user types

---

### 3. Cart Service (cart.service.ts)
**Purpose**: Manages shopping cart operations and item management

**Core Methods**:
- `getCart()` - Retrieves current user's cart with all items
- `addItem()` - Adds menu item to cart with quantity
- `updateItemQuantity()` - Changes quantity of existing cart item
- `removeItem()` - Removes specific item from cart
- `clearCart()` - Empties entire cart

**Data Structures**:
- BackendCart: Contains cart ID, user ID, restaurant ID, and items array
- BackendCartItem: Represents individual cart item with price, name, and quantity

**Constraints**:
- Cart is tied to a single restaurant (restaurantId)
- Cannot mix items from different restaurants
- Quantities tracked per menu item

---

### 4. Orders Service (orders.service.ts)
**Purpose**: Manages order creation, tracking, and order history

**Order Lifecycle Operations**:
- `placeOrder()` - Creates new order with items, payment method, and delivery address
- `getHistory()` - Retrieves user's order history
- `getById()` - Fetches specific order details
- `trackOrder()` - Gets real-time tracking information
- `cancelOrder()` - Cancels pending order
- `deleteOrder()` - Removes order from history
- `deleteAll()` - Clears entire order history
- `updateOrderStatus()` - Updates order status (admin/driver operation)
- `reorder()` - Creates new order from previous order
- `assignDriver()` - Assigns driver to order (admin operation)

**Order Data Requirements**:
- Restaurant ID
- Cart items with menu item ID and quantity
- Payment method
- Delivery address
- Optional special instructions

**Response Data**: Orders returned with complete details including items, pricing, and timestamps

---

### 5. Driver Service (driver.service.ts)
**Purpose**: Handles driver-specific operations and delivery management

**Driver Operations**:
- `getRequests()` - Lists available delivery requests for driver
- `acceptRequest()` - Accepts a delivery request
- `getActive()` - Gets currently active delivery (if any)
- `getDashboard()` - Retrieves driver statistics
- `updateOrderStatus()` - Updates status of delivery order
- `sendLocation()` - Submits current location to backend

**Dashboard Metrics**:
- todayOrders: Number of completed deliveries today
- dailyRevenue: Earnings for current day
- orderGrowth: Percentage change in orders
- revenueGrowth: Percentage change in revenue
- totalOrders: Lifetime deliveries
- totalRevenue: Lifetime earnings

**Delivery Request Management**:
Drivers receive delivery requests with order details and can accept/reject before beginning delivery

---

### 6. Location Service (location.service.ts)
**Purpose**: Provides device geolocation services and location monitoring

**Key Capabilities**:
- Permission management for location access
- Single location fetching with high accuracy
- Continuous location watching with configurable intervals
- Background location publishing capability

**Location Methods**:
- `requestPermissions()` - Requests foreground location permission
- `getCurrentLocation()` - One-time location fetch with high accuracy
- `startWatching()` - Continuous location updates
- `stopWatching()` - Halts location watching

**Customization Options**:
- Accuracy levels (High, Balanced, Low, Lowest)
- Time interval between updates (default 3 seconds)
- Distance threshold for updates (default 10 meters)

**Event System**:
- Location update listeners with automatic callback system
- Error listeners for permission and access failures
- Cleanup method for resource management

**Current State**:
- Tracks current location in memory
- Manages permission state
- Maintains active watcher subscription

---

### 7. Restaurants Service (restaurants.service.ts)
**Purpose**: Manages restaurant data, menu items, and related queries

**Restaurant Management**:
- `create()` - Creates new restaurant (owner operation)
- `getAll()` - Lists all restaurants
- `getById()` - Gets specific restaurant details
- `getByOwner()` - Lists restaurants owned by specific user
- `update()` - Updates restaurant information

**Menu Management**:
- `getMenu()` - Fetches restaurant menu items with option to include unavailable items
- `createMenuItem()` - Adds new dish to restaurant menu
- `updateMenuItem()` - Modifies existing menu item
- `deleteMenuItem()` - Removes item from menu

**Discovery Features**:
- `getCategories()` - Lists all food categories
- `getFeatured()` - Gets featured/promoted restaurants
- `getPromotions()` - Lists active promotions
- `getPopularFoods()` - Retrieves trending dishes with intelligent fallback

**Search Functionality**:
- `searchFood()` - Searches by dish name, description, restaurant name, or cuisine type
- Returns FoodItem objects with restaurant context

**Food Item Population**:
- `fetchFoodItems()` - Concurrently loads menus from multiple restaurants
- Uses configurable concurrency level (default 3) to prevent overwhelming backend
- Combines restaurant data with menu items
- Gracefully handles restaurant menu fetch failures

**Driver Operations**:
- `getDrivers()` - Retrieves list of available drivers for assignment

---

### 8. Payment Service (payment.service.ts)
**Purpose**: Handles payment processing through USSD/Mobile Money

**Payment Gateway Integration**:
- Integrates with ClickPesa payment gateway
- USSD push payment methodology (mobile money)

**Payment Initiation**:
- `initiateUSSDPush()` - Starts payment process
  - Requires: orderId, amount, phoneNumber
  - Optional: currency (defaults to TZS)
  - Returns: Transaction object and ClickPesa response

**Transaction Data**:
- id: Unique transaction identifier
- orderId: Associated order
- orderReference: Alternative order reference
- clickPesaId: External payment gateway ID
- amount: Payment amount
- phoneNumber: Customer's mobile number
- status: One of PENDING, SUCCESSFUL, or FAILED
- timestamps: Creation and update times

**Supported Currency**:
- Tanzania Shilling (TZS) as default

---

### 9. Map Service (map.service.ts)
**Purpose**: Provides mapping and route calculation using Mapbox

**Core Functionality**:
- `getAccessToken()` - Returns Mapbox API token
- `getMapStyle()` - Returns appropriate map style (light/dark theme)
- `isNative()` - Detects if running on iOS or Android
- `isWeb()` - Detects if running on web platform

**Route Calculation**:
- `fetchRoute()` - Gets driving route between two coordinates
  - Uses Mapbox Directions API
  - Returns: distance, duration, GeoJSON polyline, coordinate array
  - Graceful null return if route unavailable
  - Coordinates expected as [longitude, latitude] pairs

**Address Search**:
- `searchAddress()` - Geocodes address queries
  - Uses Mapbox Geocoding API
  - Filters results to Tanzania (TZ)
  - Returns: place names and center coordinates
  - Limited to 5 results per query

**Platform Support**:
- Detects native vs web runtime for conditional features
- Theme-based styling for light and dark modes

---

### 10. Upload Service (upload.service.ts)
**Purpose**: Handles image uploads to backend storage

**Image Upload Flow**:
- `uploadImage()` - Uploads image file
  - Accepts image URI from device
  - Automatically detects file type (png, webp, or jpeg)
  - Constructs FormData for multipart upload
  - Marks upload as 'menu' type

**File Handling**:
- Extracts filename and extension from URI
- Automatically determines MIME type based on extension
- Handles relative URLs by converting to absolute using API origin

**Response**:
- Returns absolute URL to uploaded image for immediate use
- Supports CDN or relative paths through URL resolution

---

### 11. Image Optimizer Service (imageOptimizer.ts)
**Purpose**: Optimizes image URLs for performance and device adaptation

**Optimization Features**:
- `optimizeImageUrl()` - Transforms image URLs with optimization parameters
  - Supports width, height, quality, and format settings
  - Default: WebP format with 80% quality
  - Returns original URL if CDN not configured

**CDN Configuration**:
- `setImageCDN()` - Configures CDN base URL for optimization
- `getImageCDN()` - Retrieves current CDN configuration

**Device-Aware Sizing**:
- `getScreenOptimalWidth()` - Calculates responsive width based on screen and pixel ratio
- `getScreenOptimalHeight()` - Calculates responsive height
- Supports fractional screen percentages

**Quality Settings**:
- Quality range: 0-100 (default 80)
- Formats supported: WebP, JPEG, PNG
- Graceful fallback to original URL on error

---

### 12. API Client (api.ts)
**Purpose**: Core HTTP client with authentication and token refresh handling

**Core HTTP Methods**:
- `get()` - Performs GET requests
- `post()` - Performs POST requests
- `put()` - Performs PUT requests
- `delete()` - Performs DELETE requests

**Advanced Features**:

*Token Refresh Flow*:
- Automatic token refresh on 401 Unauthorized responses
- Queue-based request handling to prevent duplicate refresh calls
- Redirects to onboarding on refresh failure

*Rate Limiting*:
- Automatic retry on 429 Too Many Requests
- Exponential backoff: 1s, 2s, 4s (up to 3 retries)

*Timeout Management*:
- 15-second timeout for all requests
- AbortController-based cancellation
- Proper cleanup of timeouts

*Auth Public Routes*:
- Special handling for auth endpoints (login, OTP, refresh)
- No token refresh for these routes to prevent loops

**Base Configuration**:
- Base URL from environment (default: https://zup-backend-dhkw.onrender.com)
- Authorization header with Bearer token
- Content-Type: application/json by default
- Dual transport support through Socket.IO compatibility

**Error Handling**:
- Custom ApiError class with status and response body
- Logout on token refresh failure
- Navigation to onboarding on auth failure

---

### 13. Driver Socket Service (driver-socket.service.ts)
**Purpose**: Real-time communication for driver operations and location sharing

**Connection Management**:
- WebSocket-based real-time events
- Auto-reconnect with 10 attempts and 3-second delays
- Dual transport support (WebSocket and polling fallback)
- Authentication via JWT token

**Event Types Handled**:
- `delivery:available` - New delivery request available
- `delivery:assigned` - Order has been assigned to driver
- `order:status` - Order status updates
- `connect`/`disconnect` - Connection state changes

**Location Publishing**:
- Automatic location publishing every 3 seconds when online
- Manual location sending capability
- Location tied to active order (if applicable)
- Publishing paused when offline or disconnected

**Driver Status**:
- `isConnected` - Socket connection state
- `isOnline` - Driver availability state
- `setOnline()` - Toggle driver availability
- `setActiveOrder()` - Track which order driver is working on

**Listener Management**:
- New request listeners for delivery opportunities
- Connection change callbacks
- Status update callbacks
- Assigned delivery callbacks
- All listeners return unsubscribe functions
- Cleanup method clears all listeners

---

### 14. Restaurant Socket Service (restaurant-socket.service.ts)
**Purpose**: Real-time notifications for restaurant operations

**Connection Setup**:
- WebSocket-based real-time communication
- Socket.IO client with auto-reconnect
- Authentication via JWT token
- Fallback to polling transport

**Event Listening**:
- `order:new` - New order notification with order ID and number
- `order:status` - Order status update notifications
- Connection and disconnection events

**Notification Flow**:
- Receives new orders with order number
- Gets status updates on assigned orders
- Maintains connection for real-time alerts

**Listener Pattern**:
- Order notification listeners receive order ID, status, and order number
- Connection change listeners for status feedback
- Unsubscribe functions for cleanup
- Cleanup method removes all listeners

---

## Architecture Patterns

### Observer/Listener Pattern
Most services (especially socket-based and location services) implement observer pattern:
- Services maintain sets of callbacks
- Listeners can subscribe/unsubscribe
- Services notify all listeners on events
- Clean separation between data and presentation

### Singleton Pattern
All services are exported as singleton instances:
- Ensures single connection/state management
- Reusable across components
- Central configuration point

### Error Handling Strategy
- Graceful degradation (functions return null/empty on failure)
- Non-critical errors caught and logged
- No exceptions thrown to UI layer
- Fallback values provided where needed

### Token Management
- Centralized in API client
- Automatic refresh on expiry
- Queue-based handling for concurrent requests
- Logout on repeated failures

### Cleanup Pattern
Most services provide cleanup methods to:
- Disconnect sockets
- Cancel subscriptions
- Clear event listeners
- Free memory resources

---

## Data Flow Overview

### Order Placement Flow
1. User browses restaurants (restaurants service)
2. Adds items to cart (cart service)
3. Initiates checkout with payment (orders service)
4. Confirms payment (payment service)
5. Backend creates order and assigns driver
6. User can track order in real-time (tracking service)

### Driver Delivery Flow
1. Driver goes online (driver socket service)
2. Driver location published periodically (driver socket service + location service)
3. Driver receives delivery notifications (driver socket service)
4. Driver accepts delivery (driver service)
5. Driver location streamed to customer (tracking service receives updates)
6. Driver completes delivery (driver service updates status)

### Real-Time Updates
1. Tracking service listens for driver location updates
2. Restaurant socket service receives new orders and status changes
3. Driver socket service notifies of available deliveries
4. Location service provides device coordinates
5. All updates propagated to UI listeners

---

## External Integrations

### Third-Party Services
1. **Mapbox** - Route calculation and address search
2. **ClickPesa** - Mobile money payment processing
3. **Socket.IO** - Real-time communication
4. **Expo Location** - Device geolocation

### Backend API
- Base URL: https://zup-backend-dhkw.onrender.com
- Endpoints organized by resource: /auth, /orders, /cart, /restaurants, /driver, /payment, /upload
- Standard REST conventions
- JSON request/response format

---

## Configuration & Environment

### Required Environment Variables
- `EXPO_PUBLIC_API_URL` - Backend API base URL (default: onrender deployment)
- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` - Mapbox API token
- Image CDN base URL (optional, for image optimization)

### Authentication
- JWT-based authentication
- Token stored in Zustand auth store
- Automatic token refresh mechanism
- Supports both access and refresh tokens

---

## Performance Considerations

### Concurrency Management
- Restaurant service limits concurrent menu fetches to 3
- Prevents overwhelming backend
- Graceful degradation on individual failures

### Location Monitoring
- Configurable accuracy levels
- Adjustable update intervals
- Distance-based filtering reduces update frequency
- Efficient subscription management

### Image Optimization
- CDN-based image transformation
- WebP format for reduced file size
- Dynamic sizing based on screen dimensions
- Pixel ratio awareness for retina displays

### Socket Connections
- Connection pooling for real-time services
- Polling fallback for restricted networks
- Exponential backoff for retries
- Automatic cleanup of disconnected sockets

---

## Known Patterns & Best Practices

### Callback Registration
All services use callback-based listeners:
```
const unsubscribe = service.onEvent((data) => {
  // handle event
});
// cleanup when done
unsubscribe();
```

### Graceful Degradation
- Null checks in data handling
- Fallback values for missing data
- Non-critical operation failures don't crash app
- Empty arrays returned instead of exceptions

### Memory Management
- Cleanup methods for all long-running services
- Listener collection cleanup
- Timeout clearing in API client
- Watcher unsubscription in location service

### Error Resilience
- Exponential backoff for rate limiting
- Token refresh queue for concurrent requests
- Connection retry with delays
- Non-blocking error callbacks

---

## Summary

The ZUP services architecture provides a comprehensive backend integration layer built on modern patterns and best practices. The system effectively handles real-time communication through multiple socket services, manages authentication and token lifecycle, integrates with third-party services, and maintains separation of concerns through specialized service classes. The architecture prioritizes reliability, performance, and user experience through graceful error handling, efficient data management, and responsive real-time updates.
