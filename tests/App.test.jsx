import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App.jsx'

const reply = (content) => ({ ok: true, json: async () => ({ message: { role: 'assistant', content } }) })

describe('App', () => {
  it('sends earlier turns with each new message', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(reply('First reply'))
      .mockResolvedValueOnce(reply('Second reply'))
    const user = userEvent.setup()
    render(<App fetchImpl={fetchImpl} />)

    await user.type(screen.getByLabelText('Message'), 'Hello{Enter}')
    expect(await screen.findByText('First reply')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Message'), 'Follow up{Enter}')
    expect(await screen.findByText('Second reply')).toBeInTheDocument()

    const sent = JSON.parse(fetchImpl.mock.calls[1][1].body).messages
    expect(sent.map(m => m.content)).toEqual(['Hello', 'First reply', 'Follow up'])
  })

  it('keeps chats separate and lists them in the sidebar', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(reply('About cats'))
      .mockResolvedValueOnce(reply('About dogs'))
    const user = userEvent.setup()
    render(<App fetchImpl={fetchImpl} />)

    await user.type(screen.getByLabelText('Message'), 'Cats{Enter}')
    await screen.findByText('About cats')
    await user.click(screen.getByText('+ New chat'))
    await user.type(screen.getByLabelText('Message'), 'Dogs{Enter}')
    await screen.findByText('About dogs')

    expect(screen.queryByText('About cats')).not.toBeInTheDocument()
    const second = JSON.parse(fetchImpl.mock.calls[1][1].body).messages
    expect(second).toHaveLength(1)

    await user.click(screen.getByText('Cats', { selector: '.history li' }))
    expect(screen.getByText('About cats')).toBeInTheDocument()
  })

  it('shows the server error and ignores empty input', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Messages cannot be empty.' }) })
    const user = userEvent.setup()
    render(<App fetchImpl={fetchImpl} />)

    await user.click(screen.getByLabelText('Send'))
    expect(fetchImpl).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Message'), 'Hi{Enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent('Messages cannot be empty.')
  })
})
