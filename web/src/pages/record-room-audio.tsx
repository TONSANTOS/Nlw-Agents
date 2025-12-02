/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
import { useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const isRecordingSupported =
    Boolean(navigator.mediaDevices) &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof MediaRecorder === 'function'

type RoomParams = {
    roomId: string
}

export function RecordRoomAudio() {
    const recorder = useRef<MediaRecorder | null>(null)
    const intervalRef = useRef<NodeJS.Timeout>(null)
    const params = useParams<RoomParams>()

    const [isRecording, setIsRecording] = useState(false)

    function stopRecording() {
        setIsRecording(false)

        if (recorder.current && recorder.current.state !== 'inactive') {
            recorder.current.stop()
        }

        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }
    }

    async function uploadAudio(audio: Blob) {
        const formData = new FormData()

        formData.append('audio', audio, 'audio.webm')

        const response = await fetch(
            `http://localhost:3333/rooms/${params.roomId}/audio`,
            {
                method: 'POST',
                body: formData,
            }
        )

        const result = await response.json()

        console.log('Áudio enviado com sucesso:', result)
    }

    function createRecorder(audio: MediaStream) {
        recorder.current = new MediaRecorder(audio, {
            mimeType: 'audio/webm',
            audioBitsPerSecond: 128_000,
        })

        recorder.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                uploadAudio(event.data)
            }
        }

        recorder.current.onstart = () => {
            console.log('Gravação iniciada')
        }

        recorder.current.onstop = () => {
            console.log('Gravação parada')
        }

        recorder.current.start()
    }

    async function startRecording() {
        if (!isRecordingSupported) {
            alert('Gravação de áudio não é suportada neste navegador.')
            return
        }

        setIsRecording(true)

        // Obter microfone do usuário
        const audio = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44_100,
            },
        })

        createRecorder(audio)

        intervalRef.current = setInterval(() => {
            recorder.current?.stop()

            createRecorder(audio)
        }, 5000)
    }

    if (!params.roomId) {
        return <Navigate to="/" />
    }

    return (
        <div className="flex h-screen flex-col items-center justify-center gap-3">
            {isRecording ? (
                <Button onClick={stopRecording} variant="destructive">
                    Pausar Gravação
                </Button>
            ) : (
                <Button onClick={startRecording}>Gravar Áudio</Button>
            )}

            {isRecording ? <p>Gravando…</p> : <p>Pausado</p>}
        </div>
    )
}
