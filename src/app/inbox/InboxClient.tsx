"use client";
import { useState, useEffect } from 'react';

export interface UserNumber {
  id: string;
  number: string;
  label: string;
  purpose: string;
  createdAt: string;
}

interface VapiCall {
  id: string;
  assistantId: string;
  phoneNumberId: string;
  type: string;
  startedAt: string;
  endedAt: string;
  transcript: string;
  recordingUrl: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  cost: number;
  customer: {
    number: string;
    sipUri: string;
  };
  status: string;
  endedReason: string;
  messages: Array<{
    role: string;
    time: number;
    message: string;
    endTime?: number;
    duration?: number;
    secondsFromStart: number;
  }>;
  stereoRecordingUrl: string;
  costBreakdown: {
    stt: number;
    llm: number;
    tts: number;
    vapi: number;
    chat: number;
    total: number;
    llmPromptTokens: number;
    llmCompletionTokens: number;
    ttsCharacters: number;
  };
  phoneCallProvider: string;
  phoneCallProviderId: string;
  phoneCallTransport: string;
  analysis: {
    summary: string;
    successEvaluation: string;
  };
  artifact: {
    recordingUrl: string;
    stereoRecordingUrl: string;
    transcript: string;
    messages: Array<{
      role: string;
      time: number;
      message: string;
      endTime?: number;
      duration?: number;
      secondsFromStart: number;
    }>;
  };
  contact?: {
    id: string;
    name: string;
    email?: string;
    company?: string;
  };
}

interface InboxClientProps {
  userNumbers: UserNumber[];
}

export default function InboxClient({ userNumbers }: InboxClientProps) {
  const [calls, setCalls] = useState<VapiCall[]>([]);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<UserNumber | null>(null);
  const [selectedCall, setSelectedCall] = useState<VapiCall | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVapiCalls();
  }, []);

  const fetchVapiCalls = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vapi-calls');
      if (response.ok) {
        const data = await response.json();
        setCalls(data.calls || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch calls');
      }
    } catch (error) {
      console.error('Error fetching VAPI calls:', error);
      setError('Failed to fetch calls');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ended':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCallsForPhoneNumber = (phoneNumberId: string) => {
    return calls.filter(call => call.phoneNumberId === phoneNumberId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">Loading calls...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Calls</h3>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchVapiCalls}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
              <p className="mt-1 text-gray-600">View all your calls and conversations from VAPI.ai.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Phone Numbers List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Your Phone Numbers</h2>
              </div>
              {userNumbers.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">No phone numbers yet</p>
                  <p className="text-gray-600">Purchase phone numbers to start receiving calls.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {userNumbers.map((phoneNumber) => {
                    const phoneCalls = getCallsForPhoneNumber(phoneNumber.id);
                    return (
                      <div
                        key={phoneNumber.id}
                        className={`px-6 py-4 cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 transition-all duration-200 ${
                          selectedPhoneNumber?.id === phoneNumber.id ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-r-2 border-purple-300' : ''
                        }`}
                        onClick={() => {
                          setSelectedPhoneNumber(phoneNumber);
                          setSelectedCall(null);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 truncate">{phoneNumber.number}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {phoneNumber.label} • {phoneNumber.purpose}
                                </p>
                                <p className="text-xs text-purple-600 mt-1 font-medium">
                                  {phoneCalls.length} calls
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Call Details */}
          <div className="lg:col-span-2">
            {selectedPhoneNumber ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedPhoneNumber.number}</h2>
                      <p className="text-sm text-gray-600">{selectedPhoneNumber.label}</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-6">
                  {(() => {
                    const phoneCalls = getCallsForPhoneNumber(selectedPhoneNumber.id);
                    if (phoneCalls.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <div className="mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto">
                              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No calls yet</h3>
                          <p className="text-gray-600">Calls to this number will appear here.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Calls List */}
                        <div className="lg:col-span-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Calls</h3>
                          <div className="space-y-3">
                            {phoneCalls.map((call) => (
                              <div
                                key={call.id}
                                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                                  selectedCall?.id === call.id
                                    ? 'bg-purple-50 border border-purple-200'
                                    : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                                onClick={() => setSelectedCall(call)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(call.status)}`}>
                                    {call.status}
                                  </span>
                                  <span className="text-xs text-gray-500">{formatDate(call.createdAt)}</span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {call.customer.number}
                                </div>
                                {call.contact && (
                                  <div className="text-xs text-purple-600 mt-1 font-medium">
                                    {call.contact.name}
                                  </div>
                                )}
                                {call.summary && (
                                  <div className="text-xs text-gray-500 mt-2 line-clamp-2">
                                    {call.summary.substring(0, 100)}...
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Call Details */}
                        <div className="lg:col-span-2">
                          {selectedCall ? (
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Call Details</h3>
                                <span className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(selectedCall.status)}`}>
                                  {selectedCall.status}
                                </span>
                              </div>
                              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <p className="text-sm text-gray-900">{new Date(selectedCall.createdAt).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                    <p className="text-sm text-gray-900">
                                      {selectedCall.startedAt && selectedCall.endedAt 
                                        ? formatDuration((new Date(selectedCall.endedAt).getTime() - new Date(selectedCall.startedAt).getTime()) / 1000)
                                        : 'N/A'
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                                    <p className="text-sm text-gray-900">{selectedCall.customer.number}</p>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                                    <p className="text-sm text-gray-900">${selectedCall.cost.toFixed(4)}</p>
                                  </div>
                                </div>
                                {selectedCall.recordingUrl && (
                                  <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Recording</label>
                                    <audio controls className="w-full">
                                      <source src={selectedCall.recordingUrl} type="audio/mpeg" />
                                      Your browser does not support the audio element.
                                    </audio>
                                  </div>
                                )}
                              </div>
                              
                              {/* Messages */}
                              {selectedCall.messages && selectedCall.messages.length > 0 && (
                                <div>
                                  <h4 className="text-lg font-medium text-gray-900 mb-4">Messages</h4>
                                  <div className="space-y-3">
                                    {selectedCall.messages
                                      .filter(msg => msg.role !== 'system')
                                      .map((message, index) => (
                                        <div
                                          key={index}
                                          className={`p-4 rounded-xl ${
                                            message.role === 'user' 
                                              ? 'bg-blue-50 border border-blue-200' 
                                              : 'bg-gray-50 border border-gray-200'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                              message.role === 'user' 
                                                ? 'bg-blue-100 text-blue-800' 
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                              {message.role === 'user' ? 'Customer' : 'Assistant'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                              {formatDuration(message.secondsFromStart)}
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-700">{message.message}</p>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                              {/* Transcript */}
                              {selectedCall.transcript && (
                                <div className="mt-6">
                                  <h4 className="text-lg font-medium text-gray-900 mb-4">Transcript</h4>
                                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                                    <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                                      {selectedCall.transcript}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Summary */}
                              {selectedCall.analysis?.summary && (
                                <div className="mt-6">
                                  <h4 className="text-lg font-medium text-gray-900 mb-4">Summary</h4>
                                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                                    <p className="text-sm text-gray-700">{selectedCall.analysis.summary}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <div className="mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto">
                                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                </div>
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Call</h3>
                              <p className="text-gray-600">Choose a call from the list to view its details and messages.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="px-6 py-12 text-center text-gray-500">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Phone Number</h3>
                  <p className="text-gray-600">Choose a phone number from the list to view its calls and messages.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 