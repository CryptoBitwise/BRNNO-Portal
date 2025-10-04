import { useState, useEffect } from 'react'
import {
    collection,
    addDoc,
    getDocs,
    doc,
    setDoc,
    getDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    updateDoc
} from 'firebase/firestore'
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth'
import { db, auth } from './firebase'

const detailers = [
    { id: 1, name: 'BRNNO Elite', location: 'Los Angeles, CA', phone: '(323) 555-0123', rating: 4.8, reviews: 127, services: ['Car', 'Truck', 'SUV'] },
    { id: 2, name: 'BRNNO Shine', location: 'Beverly Hills, CA', phone: '(310) 555-0456', rating: 4.9, reviews: 89, services: ['Car', 'Motorcycle', 'SUV'] },
    { id: 3, name: 'BRNNO Premium', location: 'Santa Monica, CA', phone: '(424) 555-0789', rating: 4.7, reviews: 203, services: ['Car', 'Truck', 'RV'] },
    { id: 4, name: 'BRNNO Care', location: 'Hollywood, CA', phone: '(323) 555-0321', rating: 4.6, reviews: 156, services: ['Car', 'SUV'] },
    { id: 5, name: 'BRNNO Experts', location: 'Pasadena, CA', phone: '(626) 555-0654', rating: 4.9, reviews: 94, services: ['Car', 'Truck', 'SUV', 'Commercial'] },
]

function App() {
    const [currentView, setCurrentView] = useState('home')
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [user, setUser] = useState(null)
    const [isBusinessMode, setIsBusinessMode] = useState(false)
    const [businessRequests, setBusinessRequests] = useState([])
    const [firebaseDetailers, setFirebaseDetailers] = useState([])
    const [loading, setLoading] = useState(true)
    const [requests, setRequests] = useState([])
    const [selectedDetailer, setSelectedDetailer] = useState(null)
    const [showDetailerProfile, setShowDetailerProfile] = useState(false)
    const [request, setRequest] = useState({
        serviceDescription: '',
        vehicleType: '',
        contactName: '',
        phone: '',
        email: '',
        date: '',
        time: ''
    })
    const [showRequestForm, setShowRequestForm] = useState(false)
    const [showLogin, setShowLogin] = useState(false)
    const [showBusinessLogin, setShowBusinessLogin] = useState(false)
    const [showBusinessSignup, setShowBusinessSignup] = useState(false)
    const [loginForm, setLoginForm] = useState({ email: '', password: '' })
    const [businessLoginForm, setBusinessLoginForm] = useState({ email: '', password: '' })
    const [businessSignupForm, setBusinessSignupForm] = useState({
        businessName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        location: '',
        services: []
    })
    const [profile, setProfile] = useState({ name: '', email: '', phone: '' })
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
    const [showPasswordForm, setShowPasswordForm] = useState(false)

    // Firebase authentication state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser({
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || 'User',
                    isBusiness: false // Will be updated from Firestore
                })
                setIsLoggedIn(true)
                loadUserProfile(user.uid)
            } else {
                setUser(null)
                setIsLoggedIn(false)
                setIsBusinessMode(false)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    // Load detailers from Firestore
    useEffect(() => {
        const loadDetailers = async () => {
            try {
                const detailersRef = collection(db, 'detailers')
                const snapshot = await getDocs(detailersRef)
                const detailersData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                setFirebaseDetailers(detailersData)
            } catch (error) {
                console.error('Error loading detailers:', error)
                // Fallback to static detailers if Firestore fails
                setFirebaseDetailers(detailers)
            }
            setLoading(false)
        }

        loadDetailers()
    }, [])

    // Real-time listener for user requests
    useEffect(() => {
        if (!user) return

        const requestsRef = collection(db, 'requests')
        const q = query(requestsRef, where('customerId', '==', user.uid), orderBy('createdAt', 'desc'))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requestsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setRequests(requestsData)
        })

        return () => unsubscribe()
    }, [user])

    // Real-time listener for business requests
    useEffect(() => {
        if (!user || !user.isBusiness) return

        const requestsRef = collection(db, 'requests')
        const q = query(requestsRef, where('detailerId', '==', user.uid), orderBy('createdAt', 'desc'))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requestsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setBusinessRequests(requestsData)
        })

        return () => unsubscribe()
    }, [user])

    // Load user profile from Firestore
    const loadUserProfile = async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid))
            if (userDoc.exists()) {
                const userData = userDoc.data()
                setUser(prev => ({
                    ...prev,
                    ...userData
                }))
                if (userData.isBusiness) {
                    setIsBusinessMode(true)
                    setCurrentView('business-dashboard')
                }
            }
        } catch (error) {
            console.error('Error loading user profile:', error)
        }
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        try {
            const userCredential = await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password)
            // User state will be updated by onAuthStateChanged
            setShowLogin(false)
            setLoginForm({ email: '', password: '' })
        } catch (error) {
            console.error('Login error:', error)
            alert('Login failed: ' + error.message)
        }
    }

    const handleBusinessLogin = async (e) => {
        e.preventDefault()
        try {
            const userCredential = await signInWithEmailAndPassword(auth, businessLoginForm.email, businessLoginForm.password)
            // User state will be updated by onAuthStateChanged
            setShowBusinessLogin(false)
            setBusinessLoginForm({ email: '', password: '' })
        } catch (error) {
            console.error('Business login error:', error)
            alert('Business login failed: ' + error.message)
        }
    }

    const handleBusinessSignup = async (e) => {
        e.preventDefault()
        if (businessSignupForm.password !== businessSignupForm.confirmPassword) {
            alert('Passwords do not match!')
            return
        }
        if (businessSignupForm.password.length < 6) {
            alert('Password must be at least 6 characters!')
            return
        }
        if (businessSignupForm.services.length === 0) {
            alert('Please select at least one service!')
            return
        }

        try {
            // Create Firebase user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                businessSignupForm.email,
                businessSignupForm.password
            )

            const user = userCredential.user

            // Create business profile in Firestore
            const businessData = {
                name: businessSignupForm.businessName,
                email: businessSignupForm.email,
                phone: businessSignupForm.phone,
                location: businessSignupForm.location,
                services: businessSignupForm.services,
                isBusiness: true,
                rating: 5.0,
                reviews: 0,
                signupDate: new Date().toISOString().split('T')[0],
                plan: "free_trial",
                trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }

            // Save user profile
            await setDoc(doc(db, 'users', user.uid), businessData)

            // Save as detailer
            await addDoc(collection(db, 'detailers'), businessData)

            setShowBusinessSignup(false)
            setBusinessSignupForm({
                businessName: '',
                email: '',
                password: '',
                confirmPassword: '',
                phone: '',
                location: '',
                services: []
            })
            alert('Business account created successfully! You can now receive service requests.')

        } catch (error) {
            console.error('Business signup error:', error)
            alert('Signup failed: ' + error.message)
        }
    }

    const toggleService = (service) => {
        setBusinessSignupForm(prev => ({
            ...prev,
            services: prev.services.includes(service)
                ? prev.services.filter(s => s !== service)
                : [...prev.services, service]
        }))
    }

    const handleLogout = async () => {
        try {
            await signOut(auth)
            // User state will be updated by onAuthStateChanged
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    const viewDetailerProfile = (detailer) => {
        setSelectedDetailer(detailer)
        setShowDetailerProfile(true)
    }

    const requestService = (detailer) => {
        if (!isLoggedIn) {
            setShowLogin(true)
            return
        }
        setSelectedDetailer(detailer)
        setShowRequestForm(true)
    }

    const submitRequest = async (e) => {
        e.preventDefault()
        try {
            const newRequest = {
                detailer: selectedDetailer.name,
                detailerId: selectedDetailer.id,
                serviceDescription: request.serviceDescription,
                vehicleType: request.vehicleType,
                contactName: request.contactName,
                phone: request.phone,
                email: request.email,
                date: request.date,
                time: request.time,
                status: 'pending',
                createdAt: new Date().toISOString(),
                customerId: user.uid
            }

            // Save to Firestore
            const docRef = await addDoc(collection(db, 'requests'), newRequest)

            // Update local state
            const requestWithId = { ...newRequest, id: docRef.id }
            setRequests([...requests, requestWithId])
            setBusinessRequests([...businessRequests, requestWithId])

            alert(`Service request sent to ${selectedDetailer.name}! They will contact you soon.`)
            setShowRequestForm(false)
            setShowDetailerProfile(false)
            setRequest({
                serviceDescription: '',
                vehicleType: '',
                contactName: '',
                phone: '',
                email: '',
                date: '',
                time: ''
            })
        } catch (error) {
            console.error('Error submitting request:', error)
            alert('Failed to submit request. Please try again.')
        }
    }

    const acceptRequest = async (requestId) => {
        try {
            // Update in Firestore
            await updateDoc(doc(db, 'requests', requestId), {
                status: 'accepted'
            })

            // Update local state
            setBusinessRequests(businessRequests.map(request =>
                request.id === requestId
                    ? { ...request, status: 'accepted' }
                    : request
            ))
            setRequests(requests.map(request =>
                request.id === requestId
                    ? { ...request, status: 'accepted' }
                    : request
            ))
            alert('Request accepted! Contact the customer to discuss pricing and scheduling.')
        } catch (error) {
            console.error('Error accepting request:', error)
            alert('Failed to accept request. Please try again.')
        }
    }

    const declineRequest = async (requestId) => {
        try {
            // Update in Firestore
            await updateDoc(doc(db, 'requests', requestId), {
                status: 'declined'
            })

            // Update local state
            setBusinessRequests(businessRequests.map(request =>
                request.id === requestId
                    ? { ...request, status: 'declined' }
                    : request
            ))
            setRequests(requests.map(request =>
                request.id === requestId
                    ? { ...request, status: 'declined' }
                    : request
            ))
            alert('Request declined.')
        } catch (error) {
            console.error('Error declining request:', error)
            alert('Failed to decline request. Please try again.')
        }
    }

    const cancelRequest = async (requestId) => {
        if (window.confirm('Are you sure you want to cancel this service request?')) {
            try {
                // Update in Firestore
                await updateDoc(doc(db, 'requests', requestId), {
                    status: 'cancelled'
                })

                // Update local state
                setRequests(requests.map(request =>
                    request.id === requestId
                        ? { ...request, status: 'cancelled' }
                        : request
                ))
            } catch (error) {
                console.error('Error cancelling request:', error)
                alert('Failed to cancel request. Please try again.')
            }
        }
    }

    const handlePasswordChange = (e) => {
        e.preventDefault()
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('New passwords do not match!')
            return
        }
        if (passwordForm.newPassword.length < 6) {
            alert('New password must be at least 6 characters!')
            return
        }
        alert('Password changed successfully!')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setShowPasswordForm(false)
    }

    const handleDeleteProfile = () => {
        if (window.confirm('Are you sure you want to delete your profile? This action cannot be undone and will cancel all your service requests.')) {
            if (window.confirm('This will permanently delete your account and all data. Are you absolutely sure?')) {
                setIsLoggedIn(false)
                setUser(null)
                setRequests([])
                setProfile({ name: '', email: '', phone: '' })
                setCurrentView('home')
                alert('Profile deleted successfully')
            }
        }
    }

    const renderHome = () => {
        if (loading) {
            return (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Available BRNNO Providers</h2>
                    <div className="text-center py-8">
                        <p className="text-gray-600">Loading detailers...</p>
                    </div>
                </div>
            )
        }

        const detailersToShow = firebaseDetailers.length > 0 ? firebaseDetailers : detailers

        return (
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Available BRNNO Providers</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {detailersToShow.map(detailer => (
                        <div key={detailer.id} className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{detailer.name}</h3>
                            <p className="text-gray-600 mb-2">{detailer.location}</p>
                            <p className="text-gray-600 mb-2">Phone: {detailer.phone}</p>
                            <p className="text-gray-600 mb-2">Rating: {detailer.rating}/5 ({detailer.reviews} reviews)</p>
                            <p className="text-gray-600 mb-4">Services: {detailer.services.join(', ')}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => viewDetailerProfile(detailer)}
                                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
                                >
                                    View Profile
                                </button>
                                <button
                                    onClick={() => requestService(detailer)}
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                                >
                                    Request Service
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const renderProfile = () => (
        <div className="max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile</h2>

            {/* Profile Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                </div>
                <button className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                    Save Profile
                </button>
            </div>

            {/* Password Change */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Password</h3>
                    <button
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                        {showPasswordForm ? 'Cancel' : 'Change Password'}
                    </button>
                </div>

                {showPasswordForm && (
                    <form onSubmit={handlePasswordChange}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <input
                                type="password"
                                required
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type="password"
                                required
                                minLength="6"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                minLength="6"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                        >
                            Change Password
                        </button>
                    </form>
                )}
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
                <p className="text-red-700 text-sm mb-4">
                    Once you delete your profile, there is no going back. This will cancel all your bookings and remove all your data.
                </p>
                <button
                    onClick={handleDeleteProfile}
                    className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                >
                    Delete Profile
                </button>
            </div>
        </div>
    )

    const renderRequests = () => (
        <div className="max-w-4xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">My Service Requests</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                    <strong>How it works:</strong> Send a request to a detailer, they'll review it and contact you directly to discuss pricing and scheduling.
                </p>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                    <p className="text-gray-600">No service requests yet</p>
                    <p className="text-gray-500 text-sm mt-2">Browse detailers and request services to get started</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map(request => (
                        <div key={request.id} className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">{request.detailer}</h3>
                                    <p className="text-gray-600"><strong>Service:</strong> {request.serviceDescription}</p>
                                    <p className="text-gray-600"><strong>Vehicle Type:</strong> {request.vehicleType}</p>
                                    <p className="text-gray-600"><strong>Contact:</strong> {request.contactName} - {request.phone}</p>
                                    <p className="text-gray-600"><strong>Preferred Date:</strong> {request.date}</p>
                                    <p className="text-gray-600"><strong>Preferred Time:</strong> {request.time}</p>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <span className={`px-3 py-1 rounded text-sm ${request.status === 'accepted'
                                        ? 'bg-green-100 text-green-800'
                                        : request.status === 'declined'
                                            ? 'bg-red-100 text-red-800'
                                            : request.status === 'cancelled'
                                                ? 'bg-gray-100 text-gray-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {request.status}
                                    </span>
                                    {request.status === 'pending' && (
                                        <button
                                            onClick={() => cancelRequest(request.id)}
                                            className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                                        >
                                            Cancel Request
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

    const renderBusinessDashboard = () => (
        <div className="max-w-6xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Business Dashboard</h2>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">Switch to:</span>
                    <button
                        onClick={() => setIsBusinessMode(false)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                    >
                        Customer View
                    </button>
                </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-medium text-center">
                    ✅ Free Trial Active - Your account is currently free. Enjoy unlimited booking requests!
                </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                    <strong>Business Mode:</strong> Review incoming service requests and accept or decline them. Contact customers directly to discuss pricing and scheduling.
                </p>
            </div>

            <div className="grid gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Incoming Requests</h3>
                    {businessRequests.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600">No service requests yet</p>
                            <p className="text-gray-500 text-sm mt-2">Requests from customers will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {businessRequests.map(request => (
                                <div key={request.id} className="border border-gray-200 rounded-lg p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900">{request.contactName}</h4>
                                            <p className="text-sm text-gray-600">Requested from: {request.detailer}</p>
                                            <p className="text-xs text-gray-500 mt-1">Received: {new Date(request.createdAt).toLocaleString()}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded text-sm ${request.status === 'accepted'
                                            ? 'bg-green-100 text-green-800'
                                            : request.status === 'declined'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {request.status}
                                        </span>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                        <h5 className="font-medium text-gray-900 mb-3">Customer Contact Information</h5>
                                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-700">Name:</span>
                                                <span className="ml-2 text-gray-900">{request.contactName}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Phone:</span>
                                                <span className="ml-2 text-gray-900">{request.phone}</span>
                                            </div>
                                            <div className="md:col-span-2">
                                                <span className="font-medium text-gray-700">Email:</span>
                                                <span className="ml-2 text-gray-900">{request.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Service Requested</p>
                                            <p className="text-gray-900 bg-blue-50 p-2 rounded">{request.serviceDescription}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Vehicle Type</p>
                                            <p className="text-gray-900">{request.vehicleType}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Preferred Date</p>
                                            <p className="text-gray-900">{request.date}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Preferred Time</p>
                                            <p className="text-gray-900">{request.time}</p>
                                        </div>
                                    </div>

                                    {request.status === 'pending' && (
                                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={() => acceptRequest(request.id)}
                                                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                                            >
                                                Accept Request
                                            </button>
                                            <button
                                                onClick={() => declineRequest(request.id)}
                                                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                                            >
                                                Decline Request
                                            </button>
                                        </div>
                                    )}

                                    {request.status === 'accepted' && (
                                        <div className="pt-4 border-t border-gray-200">
                                            <p className="text-sm text-green-700 font-medium">
                                                ✓ Request accepted - Contact the customer to discuss pricing and scheduling
                                            </p>
                                        </div>
                                    )}

                                    {request.status === 'declined' && (
                                        <div className="pt-4 border-t border-gray-200">
                                            <p className="text-sm text-red-700 font-medium">
                                                ✗ Request declined
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    const renderSettings = () => (
        <div className="max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Settings</h2>
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="mb-4">
                    <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-gray-700">Email notifications</span>
                    </label>
                </div>
                <div className="mb-4">
                    <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-gray-700">SMS notifications</span>
                    </label>
                </div>
                <div className="mb-6">
                    <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-gray-700">Marketing emails</span>
                    </label>
                </div>
                <button className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                    Save Settings
                </button>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">BRNNO Services</h1>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">BRNNO Services</h1>
                        <nav className="flex items-center gap-4">
                            {isLoggedIn ? (
                                <>
                                    {!isBusinessMode ? (
                                        <>
                                            <button
                                                onClick={() => setCurrentView('home')}
                                                className={`px-3 py-2 rounded ${currentView === 'home' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                                            >
                                                Home
                                            </button>
                                            <button
                                                onClick={() => setCurrentView('requests')}
                                                className={`px-3 py-2 rounded ${currentView === 'requests' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                                            >
                                                My Requests
                                            </button>
                                            <button
                                                onClick={() => setCurrentView('profile')}
                                                className={`px-3 py-2 rounded ${currentView === 'profile' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                                            >
                                                Profile
                                            </button>
                                            <button
                                                onClick={() => setCurrentView('settings')}
                                                className={`px-3 py-2 rounded ${currentView === 'settings' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                                            >
                                                Settings
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setCurrentView('business-dashboard')}
                                            className={`px-3 py-2 rounded ${currentView === 'business-dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                                        >
                                            Business Dashboard
                                        </button>
                                    )}

                                    <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                                        {user?.isBusiness && (
                                            <button
                                                onClick={() => {
                                                    setIsBusinessMode(!isBusinessMode)
                                                    setCurrentView(isBusinessMode ? 'home' : 'business-dashboard')
                                                }}
                                                className={`px-3 py-1 rounded text-sm ${isBusinessMode
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                {isBusinessMode ? 'Business Mode' : 'Customer Mode'}
                                            </button>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className="px-3 py-2 text-gray-600 hover:text-gray-900"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowLogin(true)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                        Customer Login
                                    </button>
                                    <button
                                        onClick={() => setShowBusinessLogin(true)}
                                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                                    >
                                        Business Login
                                    </button>
                                    <button
                                        onClick={() => setShowBusinessSignup(true)}
                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                    >
                                        Business Signup
                                    </button>
                                </div>
                            )}
                        </nav>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {currentView === 'home' && renderHome()}
                {currentView === 'profile' && renderProfile()}
                {currentView === 'requests' && renderRequests()}
                {currentView === 'settings' && renderSettings()}
                {currentView === 'business-dashboard' && renderBusinessDashboard()}
            </main>

            {showLogin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Login</h3>
                        <form onSubmit={handleLogin}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={loginForm.email}
                                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={loginForm.password}
                                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowLogin(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                                >
                                    Login
                                </button>
                            </div>
                            <div className="mt-4 text-center">
                                <p className="text-sm text-gray-600">
                                    Don't have an account?
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowLogin(false)
                                            setShowBusinessSignup(true)
                                        }}
                                        className="text-purple-600 hover:text-purple-700 font-medium ml-1"
                                    >
                                        Sign up as Business
                                    </button>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showBusinessLogin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Business Login</h3>
                        <form onSubmit={handleBusinessLogin}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={businessLoginForm.email}
                                    onChange={(e) => setBusinessLoginForm({ ...businessLoginForm, email: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={businessLoginForm.password}
                                    onChange={(e) => setBusinessLoginForm({ ...businessLoginForm, password: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowBusinessLogin(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
                                >
                                    Business Login
                                </button>
                            </div>
                            <div className="mt-4 text-center">
                                <p className="text-sm text-gray-600">
                                    Don't have a business account?
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowBusinessLogin(false)
                                            setShowBusinessSignup(true)
                                        }}
                                        className="text-green-600 hover:text-green-700 font-medium ml-1"
                                    >
                                        Sign up here
                                    </button>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showBusinessSignup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <p className="text-green-800 font-medium text-center">
                                🎉 Free for the first 3 months - No credit card required!
                            </p>
                        </div>
                        <h3 className="text-lg font-semibold mb-4">Business Signup</h3>
                        <form onSubmit={handleBusinessSignup}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Elite Auto Spa"
                                    value={businessSignupForm.businessName}
                                    onChange={(e) => setBusinessSignupForm({ ...businessSignupForm, businessName: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="business@example.com"
                                    value={businessSignupForm.email}
                                    onChange={(e) => setBusinessSignupForm({ ...businessSignupForm, email: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="(555) 123-4567"
                                    value={businessSignupForm.phone}
                                    onChange={(e) => setBusinessSignupForm({ ...businessSignupForm, phone: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Los Angeles, CA"
                                    value={businessSignupForm.location}
                                    onChange={(e) => setBusinessSignupForm({ ...businessSignupForm, location: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Services Offered</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Car', 'Truck', 'SUV', 'Motorcycle', 'RV', 'Commercial'].map(service => (
                                        <label key={service} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={businessSignupForm.services.includes(service)}
                                                onChange={() => toggleService(service)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-700">{service}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength="6"
                                    placeholder="Minimum 6 characters"
                                    value={businessSignupForm.password}
                                    onChange={(e) => setBusinessSignupForm({ ...businessSignupForm, password: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength="6"
                                    placeholder="Confirm your password"
                                    value={businessSignupForm.confirmPassword}
                                    onChange={(e) => setBusinessSignupForm({ ...businessSignupForm, confirmPassword: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowBusinessSignup(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
                                >
                                    Create Business Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetailerProfile && selectedDetailer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">{selectedDetailer.name}</h3>
                        <div className="space-y-3 mb-6">
                            <p><strong>Location:</strong> {selectedDetailer.location}</p>
                            <p><strong>Phone:</strong> {selectedDetailer.phone}</p>
                            <p><strong>Rating:</strong> {selectedDetailer.rating}/5 ({selectedDetailer.reviews} reviews)</p>
                            <p><strong>Services:</strong> {selectedDetailer.services.join(', ')}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDetailerProfile(false)}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => requestService(selectedDetailer)}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                            >
                                Request Service
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRequestForm && selectedDetailer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Request Service from {selectedDetailer.name}</h3>
                        <form onSubmit={submitRequest}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">What do you need?</label>
                                <textarea
                                    required
                                    placeholder="e.g., Full detail, interior clean, exterior wash, etc."
                                    value={request.serviceDescription}
                                    onChange={(e) => setRequest({ ...request, serviceDescription: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 h-20"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                                <select
                                    required
                                    value={request.vehicleType}
                                    onChange={(e) => setRequest({ ...request, vehicleType: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                >
                                    <option value="">Select vehicle type</option>
                                    <option value="Car">Car</option>
                                    <option value="Truck">Truck</option>
                                    <option value="SUV">SUV</option>
                                    <option value="Motorcycle">Motorcycle</option>
                                    <option value="RV">RV</option>
                                    <option value="Commercial">Commercial</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Your full name"
                                    value={request.contactName}
                                    onChange={(e) => setRequest({ ...request, contactName: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="(555) 123-4567"
                                    value={request.phone}
                                    onChange={(e) => setRequest({ ...request, phone: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="your@email.com"
                                    value={request.email}
                                    onChange={(e) => setRequest({ ...request, email: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                                <input
                                    type="date"
                                    required
                                    value={request.date}
                                    onChange={(e) => setRequest({ ...request, date: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                                <select
                                    required
                                    value={request.time}
                                    onChange={(e) => setRequest({ ...request, time: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                >
                                    <option value="">Select time</option>
                                    <option value="9:00 AM">9:00 AM</option>
                                    <option value="10:00 AM">10:00 AM</option>
                                    <option value="11:00 AM">11:00 AM</option>
                                    <option value="12:00 PM">12:00 PM</option>
                                    <option value="1:00 PM">1:00 PM</option>
                                    <option value="2:00 PM">2:00 PM</option>
                                    <option value="3:00 PM">3:00 PM</option>
                                    <option value="4:00 PM">4:00 PM</option>
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRequestForm(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                                >
                                    Send Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}

export default App
