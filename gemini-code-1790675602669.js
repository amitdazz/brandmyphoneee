import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function SpotList({ onSelectSpot }) {
  const [spots, setSpots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Supabase se initial 10 spots load karo
    const loadSpots = async () => {
      const { data, error } = await supabase
        .from('Spot')
        .select('*')
        .order('spotNumber', { ascending: true })

      if (data) setSpots(data)
      setLoading(false)
    }

    loadSpots()

    // 2. Realtime Subscription: Jaise hi kisi spot ka bid update hoga, live change dikhega
    const channel = supabase
      .channel('live-spots-channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'Spot' }, (payload) => {
        setSpots((prevSpots) =>
          prevSpots.map((s) => (s.spotNumber === payload.new.spotNumber ? payload.new : s))
        )
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', padding: '20px' }}>Loading 10 Spots...</div>

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h3 style={{ marginBottom: '16px' }}>📱 Live Fixed 10 Spots</h3>
      
      <div style={{ display: 'grid', gap: '12px' }}>
        {spots.map((spot) => (
          <div 
            key={spot.spotNumber} 
            style={{ 
              padding: '16px', 
              background: '#18181b', 
              borderRadius: '10px', 
              border: '1px solid #27272a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: '16px' }}>
                Spot #{spot.spotNumber}: {spot.name}
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#a1a1aa' }}>
                Size: {spot.size}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#34d399' }}>
                ₹{Number(spot.currentBid || spot.minBidAmount).toLocaleString('en-IN')}
              </div>
              <p style={{ margin: '2px 0 8px', fontSize: '12px', color: spot.heldBy ? '#fbbf24' : '#71717a' }}>
                {spot.heldBy ? `Held by ${spot.heldBy}` : 'Unclaimed'}
              </p>
              
              {onSelectSpot && (
                <button
                  onClick={() => onSelectSpot(spot)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    borderRadius: '6px',
                    background: '#059669',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Bid Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}