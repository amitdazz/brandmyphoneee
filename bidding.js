import { supabase } from './supabase'

export async function placeBid({ spotNumber, sponsorName, email, bidAmount, paymentId, orderId }) {
  try {
    // 1. Current Spot ka latest status fetch karo
    const { data: spot, error: spotError } = await supabase
      .from('Spot')
      .select('*')
      .eq('spotNumber', spotNumber)
      .single()

    if (spotError || !spot) throw new Error('Spot nahi mila!')

    // 2. Minimum Bid Validation Check (Current Bid + ₹500 rule)
    const minimumRequired = Number(spot.currentBid || spot.minBidAmount) + 500
    if (bidAmount < minimumRequired) {
      throw new Error(`Bid kam se kam ₹${minimumRequired} honi chahiye!`)
    }

    // 3. Sponsor details save ya update karo
    const { data: sponsor, error: sponsorError } = await supabase
      .from('Sponsor')
      .upsert({ name: sponsorName, email: email }, { onConflict: 'email' })
      .select()
      .single()

    if (sponsorError) throw sponsorError

    // 4. Nayi Bid record karo
    const { data: newBid, error: bidError } = await supabase
      .from('Bid')
      .insert({
        amount: bidAmount,
        status: 'ACTIVE',
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
        spotId: spot.id,
        sponsorId: sponsor.id,
      })

    if (bidError) throw bidError

    // 5. Spot Table update karo (Naya price aur Leader name)
    const { error: updateSpotError } = await supabase
      .from('Spot')
      .update({
        currentBid: bidAmount,
        heldBy: sponsorName,
        status: 'BIDDING',
      })
      .eq('spotNumber', spotNumber)

    if (updateSpotError) throw updateSpotError

    return { success: true, message: 'Bid successfully lag gayi!' }
  } catch (err) {
    console.error('Bid error:', err)
    return { success: false, error: err.message }
  }
}
