import { Typography } from '@/components/typography'
import { useEffect, useState } from 'react'
import { profileItems, type ProfileItem } from './profile-items'
import type { DemoChallengeController } from './use-demo-challenge'
import { formatRubles } from './demo-format'
import './local-demo.css'

export type HomePanel = 'stores' | 'notifications' | 'help' | 'history' | 'ratings' | 'savings' | 'promotion'

export function LocalDemoPage({ page, onProfile }: { page: 'catalog' | 'orange'; onProfile: () => void }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ProfileItem | null>(null)
  return (
    <main className="local-page">
      <Typography as="span" variant="bodySm" className="local-eyebrow">Fika</Typography>
      <Typography as="h1" variant="h1">{page === 'catalog' ? 'Reward catalog' : 'Orange benefits'}</Typography>
      {page === 'orange' ? <>
        <div className="local-hero"><Typography as="span" variant="bodySm">🍊</Typography><Typography as="h2" variant="h2">Make your collection count</Typography><Typography as="p" variant="bodySm">Earn digital kitchen items, combine any four and create a personal discount. Matching sets unlock a recipe bonus.</Typography></div>
        <ol className="local-steps"><li><Typography as="span" variant="bodySm">Open a box or complete a personal challenge.</Typography></li><li><Typography as="span" variant="bodySm">Collect and exchange items of the same rarity.</Typography></li><li><Typography as="span" variant="bodySm">Choose four available items in Collection.</Typography></li><li><Typography as="span" variant="bodySm">Craft a discount and show its demonstration barcode.</Typography></li></ol>
        <Typography as="p" variant="bodySm">No subscription or real payment is required. All rewards and redemptions here are simulated.</Typography>
        <button className="local-primary" onClick={onProfile}><Typography as="span" variant="bodySm">Explore my rewards</Typography></button>
      </> : <>
        <Typography as="p" variant="bodySm">Explore all 24 collectible items. Open boxes and complete challenges to add them to your collection.</Typography>
        <input aria-label="Search rewards" placeholder="Search by item, category or rarity" value={query} onChange={event => setQuery(event.target.value)} />
        <div className="local-catalog">{profileItems.filter(item => `${item.name} ${item.category} ${item.rarity}`.toLowerCase().includes(query.toLowerCase())).map(item => (
          <button className="local-item" key={item.id} onClick={() => setSelected(item)}><img src={item.iconSrc} alt="" /><Typography as="small" variant="bodyXs">{item.rarity}</Typography><Typography as="strong" variant="emphasis">{item.name}</Typography><Typography as="span" variant="bodySm">{item.category}</Typography></button>
        ))}</div>
        {profileItems.every(item => !`${item.name} ${item.category} ${item.rarity}`.toLowerCase().includes(query.toLowerCase())) ? <Typography as="p" variant="bodySm">No matching items. Try another search.</Typography> : null}
        {selected ? <LocalDialog title={selected.name} onClose={() => setSelected(null)}><img className="local-detail-image" src={selected.iconSrc} alt={selected.name} /><Typography as="p" variant="bodySm">{selected.description}</Typography><Typography as="p" variant="bodySm">{selected.rarity} · {selected.category}</Typography><button className="local-primary" onClick={onProfile}><Typography as="span" variant="bodySm">Go to my collection</Typography></button></LocalDialog> : null}
      </>}
    </main>
  )
}

export function LocalDialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [onClose])
  return <div className="local-overlay"><section className="local-dialog" role="dialog" aria-modal="true" aria-label={title}><header><Typography as="h2" variant="h2">{title}</Typography><button aria-label="Close dialog" onClick={onClose}><Typography as="span" variant="bodySm">×</Typography></button></header>{children}</section></div>
}

export function HomeDetailPanel({ panel, demo, onClose, onProfile, store, onStore }: {
  panel: HomePanel; demo: DemoChallengeController; onClose: () => void; onProfile: () => void;
  store: string; onStore: (store: string) => void;
}) {
  const [rating, setRating] = useState(() => Number(localStorage.getItem('x5-product-rating') ?? 0))
  const titles: Record<HomePanel, string> = { stores: 'Choose a demo store', notifications: 'Notifications', help: 'How to play', history: 'Purchase history', ratings: 'Rate your experience', savings: 'My savings', promotion: 'Seasonal rewards' }
  const state = demo.state
  return <LocalDialog title={titles[panel]} onClose={onClose}>
    {panel === 'stores' ? ['St Petersburg · Store 4A', 'Moscow · Central Store', 'Baku · Demo Store'].map(name => <button key={name} className="local-row" aria-pressed={name === store} onClick={() => { onStore(name); onClose() }}><Typography as="span" variant="bodySm">{name}</Typography><Typography as="span" variant="bodySm">{name === store ? ' ✓' : ''}</Typography></button>) : null}
    {panel === 'history' ? <>{state?.profile.receipts.length ? state.profile.receipts.slice().sort((a, b) => b.purchased_at_ms - a.purchased_at_ms).map(receipt => <article className="local-row" key={receipt.receipt_id}><Typography as="strong" variant="emphasis">{new Date(receipt.purchased_at_ms).toLocaleDateString('en-GB')}</Typography><Typography as="p" variant="bodySm">{receipt.lines.map(line => `${line.category} ×${line.quantity}`).join(', ')}</Typography><Typography as="span" variant="bodySm">{formatRubles(receipt.lines.reduce((sum, line) => sum + line.amount_kopecks, 0))} · {receipt.returned ? 'Returned' : 'Paid'}</Typography></article>) : <Typography as="p" variant="bodySm">Your purchase history is loading.</Typography>}<Typography as="small" variant="bodyXs">These are synthetic demonstration receipts.</Typography></> : null}
    {panel === 'ratings' ? <><Typography as="p" variant="bodySm">How was your demo experience?</Typography><div className="local-stars">{[1, 2, 3, 4, 5].map(value => <button key={value} aria-label={`Rate ${value} stars`} aria-pressed={rating === value} onClick={() => { setRating(value); localStorage.setItem('x5-product-rating', String(value)) }}><Typography as="span" variant="bodySm">{value <= rating ? '★' : '☆'}</Typography></button>)}</div><Typography as="p" variant="bodySm" role="status">{rating ? `Thank you! Your ${rating}-star rating is saved on this computer.` : 'Select a star to save your rating.'}</Typography></> : null}
    {panel === 'savings' ? <><Typography as="h3" variant="h3">{formatRubles(state?.profile.progress.redeemed_savings_28d_kopecks ?? 0)}</Typography><Typography as="p" variant="bodySm">Confirmed savings in the last 28 days. Craft and redeem a demonstration discount to see this number update.</Typography><Typography as="p" variant="bodySm">{state?.profile.active_coupon ? `Active discount: ${state.profile.active_coupon.percent}%` : 'You do not have an active discount yet.'}</Typography><button className="local-primary" onClick={onProfile}><Typography as="span" variant="bodySm">Open collection and discounts</Typography></button></> : null}
    {panel === 'notifications' ? <><article className="local-row"><Typography as="strong" variant="emphasis">Welcome to Checkpoint</Typography><Typography as="p" variant="bodySm">Your box is ready to explore in Profile.</Typography></article><article className="local-row"><Typography as="strong" variant="emphasis">{state?.challenge ? 'Your personal challenge' : 'Find your next reward'}</Typography><Typography as="p" variant="bodySm">{state?.card?.headline ?? 'Open Profile and select Show the challenge.'}</Typography></article><button className="local-primary" onClick={onProfile}><Typography as="span" variant="bodySm">View my rewards</Typography></button></> : null}
    {panel === 'help' ? <><ol className="local-steps"><li><Typography as="span" variant="bodySm">Open Profile, then click the reward box.</Typography></li><li><Typography as="span" variant="bodySm">Click the large box again to reveal an item. Press Collect.</Typography></li><li><Typography as="span" variant="bodySm">In Collection, select four items and craft a discount.</Typography></li><li><Typography as="span" variant="bodySm">Open Challenges, show a challenge and simulate a qualifying purchase.</Typography></li><li><Typography as="span" variant="bodySm">Use Friends for ranking and the exchange icon for item trading.</Typography></li></ol><Typography as="p" variant="bodySm">Demo stand lets you switch sample profiles and test receipt outcomes. No real purchases or payments take place.</Typography><button className="local-primary" onClick={onProfile}><Typography as="span" variant="bodySm">Start playing</Typography></button></> : null}
    {panel === 'promotion' ? <><img className="local-detail-image" src="/assets/pyaterochka-cardboard-chest.webp" alt="Reward box" /><Typography as="p" variant="bodySm">Explore seasonal kitchen collectibles and turn four items into a personal discount.</Typography><Typography as="p" variant="bodySm">The original promotional banners are illustrations. This local version lets you try the collectible reward game without entering a real prize draw.</Typography><button className="local-primary" onClick={onProfile}><Typography as="span" variant="bodySm">Try the reward game</Typography></button></> : null}
  </LocalDialog>
}
