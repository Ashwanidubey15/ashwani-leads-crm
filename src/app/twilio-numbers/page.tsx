"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Address {
	sid: string;
	friendlyName: string;
	customerName: string;
	street: string;
	streetSecondary?: string | null;
	city: string;
	region: string;
	postalCode: string;
	isoCountry: string;
}

interface AvailableNumber {
	friendlyName?: string;
	phoneNumber: string;
	locality?: string;
	region?: string;
	postalCode?: string;
}

export default function TwilioNumbersPage() {
	const { data: session } = useSession();
	const [country, setCountry] = useState("AU");
	const [type, setType] = useState("mobile");
	const [numbers, setNumbers] = useState<AvailableNumber[]>([]);
	const [loadingSearch, setLoadingSearch] = useState(false);
	const [addresses, setAddresses] = useState<Address[]>([]);
	const [loadingAddresses, setLoadingAddresses] = useState(false);
	const [showAddressModal, setShowAddressModal] = useState(false);
	const [selectedNumber, setSelectedNumber] = useState<AvailableNumber | null>(null);
	const [selectedAddressSid, setSelectedAddressSid] = useState<string>("");
	const [purchaseLabel, setPurchaseLabel] = useState("Business Line");
	const [assistantId, setAssistantId] = useState<string>("");
	const [assistants, setAssistants] = useState<{ id: string; name: string }[]>([]);
	const [loadingPurchase, setLoadingPurchase] = useState(false);
	const [error, setError] = useState<string>("");
	const [success, setSuccess] = useState<string>("");

	useEffect(() => {
		if (!session?.user?.email) return;
		fetch("/api/assistants")
			.then((r) => r.json())
			.then((data) => setAssistants((data || []).map((a: any) => ({ id: a.id, name: a.name }))))
			.catch(() => {});
	}, [session?.user?.email]);

	function resetMessages() {
		setError("");
		setSuccess("");
	}

	async function searchNumbers() {
		resetMessages();
		setLoadingSearch(true);
		try {
			const params = new URLSearchParams();
			params.set("country", country);
			params.set("type", type);
			params.set("limit", "20");
			const res = await fetch(`/api/twilio/search-numbers?${params.toString()}`);
			if (!res.ok) throw new Error("Failed to search numbers");
			const data = await res.json();
			setNumbers(data || []);
		} catch (e: any) {
			setError(e.message);
		} finally {
			setLoadingSearch(false);
		}
	}

	async function loadAddresses() {
		setLoadingAddresses(true);
		try {
			const res = await fetch(`/api/twilio/addresses`);
			if (!res.ok) throw new Error("Failed to load addresses");
			const data = await res.json();
			setAddresses(data || []);
		} catch (e: any) {
			setError(e.message);
		} finally {
			setLoadingAddresses(false);
		}
	}

	async function createAddress(form: FormData) {
		resetMessages();
		try {
			const body = Object.fromEntries(form.entries());
			const res = await fetch(`/api/twilio/addresses`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					country: body.country,
					customerName: body.customerName,
					friendlyName: body.friendlyName,
					addressLine1: body.addressLine1,
					addressLine2: body.addressLine2,
					city: body.city,
					state: body.state,
					zipCode: body.zipCode,
				}),
			});
			if (!res.ok) throw new Error("Failed to create address");
			await loadAddresses();
		} catch (e: any) {
			setError(e.message);
		}
	}

	async function purchaseNumber() {
		resetMessages();
		if (!selectedNumber) return;
		if (!assistantId) {
			setError("Please select an assistant");
			return;
		}
		setLoadingPurchase(true);
		try {
			const res = await fetch(`/api/twilio/purchase-number`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					phoneNumber: selectedNumber.phoneNumber,
					addressSid: selectedAddressSid || undefined,
					label: purchaseLabel,
					assistantId,
				}),
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data?.error || "Failed to purchase number");
			}
			setSuccess("Number purchased successfully");
			setShowAddressModal(false);
		} catch (e: any) {
			setError(e.message);
		} finally {
			setLoadingPurchase(false);
		}
	}

	const canSearch = true;

	return (
		<div className="p-6">
			<h1 className="text-2xl font-semibold mb-4">Twilio Numbers</h1>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
				<div>
					<label className="block text-sm font-medium mb-1">Country</label>
					<select value={country} disabled className="border rounded px-3 py-2 w-full">
						<option value="AU">Australia</option>
					</select>
				</div>
				<div>
					<label className="block text-sm font-medium mb-1">Type</label>
					<select value={type} onChange={(e) => setType(e.target.value)} className="border rounded px-3 py-2 w-full">
						<option value="local">Local</option>
						<option value="mobile">Mobile</option>
						<option value="tollfree">Toll-Free</option>
					</select>
				</div>
				<div>
					<button onClick={searchNumbers} disabled={!canSearch || loadingSearch} className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50 w-full">{loadingSearch ? "Searching..." : "Search"}</button>
				</div>
			</div>

			{error && <div className="mt-4 text-red-600">{error}</div>}
			{success && <div className="mt-4 text-green-600">{success}</div>}

			<div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{numbers.map((n) => (
					<div key={n.phoneNumber} className="border rounded p-4 flex flex-col gap-2">
						<div className="text-lg font-semibold">{n.phoneNumber}</div>
						<div className="text-sm text-gray-600">{n.locality || n.region || n.postalCode || ""}</div>
						<div className="flex gap-2 mt-2">
							<button
								onClick={async () => {
								setSelectedNumber(n);
								setShowAddressModal(true);
								await loadAddresses();
							}}
								className="bg-blue-600 text-white px-3 py-2 rounded"
							>
								Buy
							</button>
						</div>
					</div>
				))}
			</div>

			{showAddressModal && (
				<div className="fixed inset-0 bg-black/40 flex items-center justify-center">
					<div className="bg-white rounded p-6 w-full max-w-2xl">
						<h2 className="text-xl font-semibold mb-4">Assign Address & Purchase</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="col-span-1">
								<label className="block text-sm font-medium mb-1">Select Existing Address</label>
								<select value={selectedAddressSid} onChange={(e) => setSelectedAddressSid(e.target.value)} className="border rounded px-3 py-2 w-full">
									<option value="">None</option>
									{addresses.map((a) => (
										<option key={a.sid} value={a.sid}>{a.friendlyName} - {a.customerName}</option>
									))}
								</select>
								<div className="mt-3">
									<label className="block text-sm font-medium mb-1">Assistant</label>
									<select value={assistantId} onChange={(e) => setAssistantId(e.target.value)} className="border rounded px-3 py-2 w-full">
										<option value="">Select assistant</option>
										{assistants.map((a) => (
											<option key={a.id} value={a.id}>{a.name}</option>
										))}
									</select>
								</div>
								<div className="mt-3">
									<label className="block text-sm font-medium mb-1">Label</label>
									<input value={purchaseLabel} onChange={(e) => setPurchaseLabel(e.target.value)} className="border rounded px-3 py-2 w-full" />
								</div>
								<div className="mt-4 flex gap-2">
									<button onClick={purchaseNumber} disabled={loadingPurchase} className="bg-green-600 text-white px-4 py-2 rounded">{loadingPurchase ? "Purchasing..." : "Purchase"}</button>
									<button onClick={() => setShowAddressModal(false)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
								</div>
							</div>

							<div className="col-span-1">
								<h3 className="text-md font-semibold mb-2">Create New Address</h3>
								<form action={async (formData: FormData) => {
									await createAddress(formData);
								}} className="grid grid-cols-2 gap-3">
									<div className="col-span-2">
										<label className="block text-sm font-medium mb-1">Country</label>
										<select name="country" defaultValue="US" className="border rounded px-3 py-2 w-full">
											<option value="US">United States</option>
											<option value="CA">Canada</option>
											<option value="GB">United Kingdom</option>
											<option value="AU">Australia</option>
										</select>
									</div>
									<div className="col-span-2">
										<label className="block text-sm font-medium mb-1">Customer or Business Name</label>
										<input name="customerName" className="border rounded px-3 py-2 w-full" required />
									</div>
									<div className="col-span-2">
										<label className="block text-sm font-medium mb-1">Address Friendly Name</label>
										<input name="friendlyName" className="border rounded px-3 py-2 w-full" required />
									</div>
									<div className="col-span-2">
										<label className="block text-sm font-medium mb-1">Address Line 1</label>
										<input name="addressLine1" className="border rounded px-3 py-2 w-full" required />
									</div>
									<div className="col-span-2">
										<label className="block text-sm font-medium mb-1">Address Line 2</label>
										<input name="addressLine2" className="border rounded px-3 py-2 w-full" />
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">City</label>
										<input name="city" className="border rounded px-3 py-2 w-full" required />
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">State</label>
										<input name="state" className="border rounded px-3 py-2 w-full" required />
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">Zip Code</label>
										<input name="zipCode" className="border rounded px-3 py-2 w-full" required />
									</div>
									<div className="col-span-2 mt-2">
										<button className="bg-purple-600 text-white px-4 py-2 rounded">Save Address</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
} 