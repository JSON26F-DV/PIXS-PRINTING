import React, { useState } from 'react'

const Test: React.FC = () => {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleSend = async () => {
    setSending(true)
    setResult(null)

    try {
      const res = await fetch('/api/test/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'jasonbegornia57@gmail.com',
          subject: 'hello world',
          html: '<p>it works!</p>',
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setResult(`Success: ${data.message}`)
      } else {
        setResult(`Error ${res.status}: ${data.message}`)
      }
    } catch (err: unknown) {
      setResult(`Network error: ${(err as Error).message}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Resend Email Test</h1>
      <button
        onClick={handleSend}
        disabled={sending}
        style={{
          padding: '12px 24px',
          fontSize: 16,
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: sending ? 'not-allowed' : 'pointer',
          opacity: sending ? 0.6 : 1,
        }}
      >
        {sending ? 'Sending...' : 'Send Test Email'}
      </button>
      {result && (
        <pre style={{ marginTop: 20, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          {result}
        </pre>
      )}
    </div>
  )
}

export default Test
