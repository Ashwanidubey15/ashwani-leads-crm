// import Image from "next/image";
// import Link from "next/link";

// const features = [
//   {
//     icon: (
//       <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
//       </svg>
//     ),
//     title: "Smart Phone Number Management",
//     desc: "Purchase and manage phone numbers directly from Vapi. Get instant access to professional business lines with voice and SMS capabilities.",
//   },
//   {
//     icon: (
//       <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
//       </svg>
//     ),
//     title: "AI-Powered Assistants",
//     desc: "Create intelligent AI assistants with custom conversation flows. Connect them to your phone numbers for automated customer interactions.",
//   },
//   {
//     icon: (
//       <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
//       </svg>
//     ),
//     title: "Real-time Analytics",
//     desc: "Track call performance, conversation quality, and lead conversion rates with comprehensive dashboards and insights.",
//   },
//   {
//     icon: (
//       <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//       </svg>
//     ),
//     title: "Enterprise Security",
//     desc: "Bank-level security with encrypted communications, secure API integrations, and compliance with industry standards.",
//   },
// ];

// const howItWorks = [
//   {
//     step: "1",
//     title: "Get Your Phone Number",
//     desc: "Purchase a professional business phone number through our Vapi integration in seconds.",
//     icon: (
//       <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//       </svg>
//     )
//   },
//   {
//     step: "2",
//     title: "Create AI Assistant",
//     desc: "Design your AI assistant with custom conversation flows and personality.",
//     icon: (
//       <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//       </svg>
//     )
//   },
//   {
//     step: "3",
//     title: "Connect & Automate",
//     desc: "Link your assistant to your phone number and start receiving calls automatically.",
//     icon: (
//       <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
//       </svg>
//     )
//   },
//   {
//     step: "4",
//     title: "Track & Optimize",
//     desc: "Monitor performance, analyze conversations, and optimize your sales process.",
//     icon: (
//       <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//       </svg>
//     )
//   }
// ];

// const testimonials = [
//   {
//     name: "Sarah Johnson",
//     role: "Sales Director",
//     company: "TechFlow Inc",
//     avatar: "https://randomuser.me/api/portraits/women/44.jpg",
//     quote: "TrueLeads transformed our lead generation. The AI assistants handle initial conversations perfectly, and our conversion rate increased by 300%.",
//     rating: 5
//   },
//   {
//     name: "Michael Chen",
//     role: "Founder",
//     company: "StartupXYZ",
//     avatar: "https://randomuser.me/api/portraits/men/32.jpg",
//     quote: "The phone number management is seamless. We got our business line instantly and the AI integration is incredibly powerful.",
//     rating: 5
//   },
// ];

// export default function Home() {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
//       {/* Header */}
//       <header className="relative z-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center py-6">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg">
//                 <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                 </svg>
//               </div>
//               <div>
//                 <div className="text-xl font-bold text-gray-900">Suhavi Leads</div>
//                 <div className="text-xs text-purple-600 font-medium">CRM Platform</div>
//               </div>
//             </div>
//             <nav className="flex gap-6 items-center">
//               <Link href="/login" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
//                 Sign In
//               </Link>
//               <Link href="/login" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105">
//                 Get Started
//               </Link>
//             </nav>
//           </div>
//         </div>
//       </header>

//       {/* Hero Section */}
//       <section className="relative overflow-hidden">
//         <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-purple-800/10"></div>
//         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
//           <div className="text-center">
//             <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-8">
//               <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
//               AI-Powered CRM Platform
//             </div>
//             <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
//               Supercharge Your
//               <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent"> Sales Process</span>
//             </h1>
//             <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
//               Automate lead generation with AI-powered phone conversations. Purchase numbers instantly, create intelligent assistants, and convert more customers.
//             </p>
//             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
//               <Link href="/login" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-200 transform hover:scale-105">
//                 Start Free Trial
//               </Link>
//               <button className="text-purple-600 hover:text-purple-700 font-semibold text-lg flex items-center gap-2">
//                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//                 Watch Demo
//               </button>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="py-24 bg-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl font-bold text-gray-900 mb-4">
//               Everything You Need to Scale
//             </h2>
//             <p className="text-xl text-gray-600 max-w-2xl mx-auto">
//               Powerful features designed to automate your sales process and boost conversions
//             </p>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             {features.map((feature, index) => (
//               <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
//                 <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center text-purple-600 mb-6">
//                   {feature.icon}
//                 </div>
//                 <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
//                 <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* How It Works */}
//       <section className="py-24 bg-gradient-to-br from-purple-50 to-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl font-bold text-gray-900 mb-4">
//               Get Started in Minutes
//             </h2>
//             <p className="text-xl text-gray-600">
//               Simple setup process to get your AI-powered sales system running
//             </p>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//             {howItWorks.map((item, index) => (
//               <div key={index} className="text-center">
//                 <div className="relative mb-6">
//                   <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto shadow-lg">
//                     {item.step}
//                   </div>
//                   {index < howItWorks.length - 1 && (
//                     <div className="hidden lg:block absolute top-8 left-full w-16 h-0.5 bg-gradient-to-r from-purple-600 to-purple-200 transform translate-x-2"></div>
//                   )}
//                 </div>
//                 <div className="flex justify-center mb-4 text-purple-600">{item.icon}</div>
//                 <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
//                 <p className="text-gray-600">{item.desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Testimonials */}
//       <section className="py-24 bg-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl font-bold text-gray-900 mb-4">
//               Loved by Sales Teams
//             </h2>
//             <p className="text-xl text-gray-600">
//               See what our customers are saying about TrueLeads
//             </p>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             {testimonials.map((testimonial, index) => (
//               <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 shadow-lg">
//                 <div className="flex items-center gap-4 mb-6">
//                   <Image
//                     src={testimonial.avatar}
//                     alt={testimonial.name}
//                     width={56}
//                     height={56}
//                     className="rounded-full"
//                   />
//                   <div>
//                     <div className="font-bold text-gray-900">{testimonial.name}</div>
//                     <div className="text-sm text-gray-600">{testimonial.role} at {testimonial.company}</div>
//                     <div className="flex gap-1 mt-1">
//                       {[...Array(testimonial.rating)].map((_, i) => (
//                         <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
//                           <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//                         </svg>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//                 <p className="text-gray-700 italic text-lg leading-relaxed">"{testimonial.quote}"</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="py-24 bg-gradient-to-br from-purple-600 to-purple-800">
//         <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
//           <h2 className="text-4xl font-bold text-white mb-6">
//             Ready to Transform Your Sales?
//           </h2>
//           <p className="text-xl text-purple-100 mb-8">
//             Join thousands of sales teams using TrueLeads to automate their lead generation and boost conversions.
//           </p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <Link href="/login" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-200 transform hover:scale-105">
//               Start Free Trial
//             </Link>
//             <button className="border-2 border-white text-white hover:bg-white hover:text-purple-600 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200">
//               Schedule Demo
//             </button>
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-gray-900 text-white py-12">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
//             <div>
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
//                   <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                   </svg>
//                 </div>
//                 <div>
//                   <div className="font-bold">TrueLeads</div>
//                   <div className="text-xs text-gray-400">CRM Platform</div>
//                 </div>
//               </div>
//               <p className="text-gray-400 text-sm">
//                 Automate your sales process with AI-powered conversations and intelligent lead management.
//               </p>
//             </div>
//             <div>
//               <h3 className="font-bold mb-4">Product</h3>
//               <ul className="space-y-2 text-gray-400">
//                 <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
//                 <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
//                 <li><Link href="#" className="hover:text-white transition-colors">API</Link></li>
//                 <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
//               </ul>
//             </div>
//             <div>
//               <h3 className="font-bold mb-4">Company</h3>
//               <ul className="space-y-2 text-gray-400">
//                 <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
//                 <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
//                 <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
//                 <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
//               </ul>
//             </div>
//             <div>
//               <h3 className="font-bold mb-4">Support</h3>
//               <ul className="space-y-2 text-gray-400">
//                 <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
//                 <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
//                 <li><Link href="#" className="hover:text-white transition-colors">Status</Link></li>
//                 <li><Link href="#" className="hover:text-white transition-colors">Contact Support</Link></li>
//               </ul>
//             </div>
//           </div>
//           <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
//             <p>&copy; 2024 TrueLeads. All rights reserved.</p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }

"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back
          </h2>
          <p className="text-gray-600">Sign in to your TrueLeads CRM account</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 px-4 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="..." />
                {/* Rest of your SVG path */}
              </svg>
              <span className="text-gray-700 font-medium">
                Continue with Google
              </span>
            </button>

            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-gray-700 font-medium">
                Continue with Facebook
              </span>
            </button>
          </div>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <Link
              href="/forgot-password"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Forgot your password?
            </Link>
            <div className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
