'use client'

// /* eslint-disable no-console */
// import { useState, useEffect } from 'react'

// export default function WebSocketTest() {
//   const [socket, setSocket] = useState<WebSocket | null>(null)
//   const [messages, setMessages] = useState<string[]>([])
//   const [inputValue, setInputValue] = useState('')
//   const [isConnected, setIsConnected] = useState(false)
//   const [connectionState, setConnectionState] = useState<number | null>(null)

//   // 연결 상태를 텍스트로 변환하는 함수
//   const getConnectionStateText = (state: number | null) => {
//     if (state === null) return '상태 없음'

//     switch (state) {
//       case WebSocket.CONNECTING:
//         return 'CONNECTING (0) - 연결 시도 중...'
//       case WebSocket.OPEN:
//         return 'OPEN (1) - 연결 완료!'
//       case WebSocket.CLOSING:
//         return 'CLOSING (2) - 연결 종료 중...'
//       case WebSocket.CLOSED:
//         return 'CLOSED (3) - 연결 종료됨'
//       default:
//         return `알 수 없는 상태 (${state})`
//     }
//   }

//   // 연결 상태에 따른 색상 반환
//   const getConnectionStateColor = (state: number | null) => {
//     if (state === null) return '#999'

//     switch (state) {
//       case WebSocket.CONNECTING:
//         return '#ff9800' // 주황색 - 연결 중
//       case WebSocket.OPEN:
//         return '#4caf50' // 초록색 - 연결됨
//       case WebSocket.CLOSING:
//         return '#ff5722' // 빨간-주황 - 종료 중
//       case WebSocket.CLOSED:
//         return '#f44336' // 빨간색 - 종료됨
//       default:
//         return '#999'
//     }
//   }

//   const getCurrentTime = () => {
//     const now = new Date()
//     const hours = now.getHours().toString().padStart(2, '0')
//     const minutes = now.getMinutes().toString().padStart(2, '0')
//     return `${hours}:${minutes}`
//   }

//   // 웹소켓 연결
//   const connect = () => {
//     console.log('🔗 연결 시도 중...')

//     const ws = new WebSocket('wss://echo.websocket.org')

//     ws.onopen = () => {
//       console.log('웹소켓 연결됨!')
//       setIsConnected(true)
//       setConnectionState(ws.readyState)
//       setMessages((prev) => [
//         ...prev,
//         `${getCurrentTime()} - ✅ 서버에 연결되었습니다`,
//       ])
//     }

//     ws.onmessage = (event) => {
//       console.log('메시지 받음:', event.data)
//       setMessages((prev) => [
//         ...prev,
//         `${getCurrentTime()} - 🔄 Echo 응답: ${event.data}`,
//       ])
//     }

//     ws.onclose = (e) => {
//       console.log('웹소켓 연결 종료됨')
//       setIsConnected(false)
//       setConnectionState(ws.readyState)
//       setMessages((prev) => [
//         ...prev,
//         `${getCurrentTime()} - ❌ 서버 연결이 종료되었습니다`,
//       ])
//       clearInterval(stateMonitor)

//       // 1000 = 정상 종료 (사용자가 의도적으로 "연결해제" 버튼 클릭)
//       // 1000 != 비정상 종료 (비의도적으로 "연결이 끊긴 상황")
//       if (e.code === 1000) {
//         // 정상 종료
//         setMessages((prev) => [
//           ...prev,
//           `${getCurrentTime()} - 정상적으로 연결을 해제했습니다`,
//         ])
//       } else {
//         // 비정상 종료 - 재연결은 하지 않음 (단순화)
//         setMessages((prev) => [
//           ...prev,
//           `${getCurrentTime()} - 비정상 종료됨 (code: ${e.code})`,
//         ])
//       }
//     }

//     ws.onerror = (error) => {
//       console.error('웹소켓 에러:', error)
//       setMessages((prev) => [...prev, '🚨 연결 에러가 발생했습니다'])
//     }

//     // 생성한 웹소켓 객체를 상태에 저장해서 나중에 사용할 수 있게 함
//     setSocket(ws)

//     // 0.1초마다 웹소켓 상태를 체크해서 UI에 반영해라
//     const stateMonitor = setInterval(() => {
//       if (ws) {
//         setConnectionState(ws.readyState)
//       }
//     }, 100) // 100ms마다 상태 확인
//   }

//   // 메시지 전송
//   const sendMessage = () => {
//     console.log('sendMessage 함수 실행됨, inputValue:', inputValue)
//     // inputValue.trim() : 입력값에서 공백 제거했을 때 내용이 있는가?
//     if (socket && socket.readyState === WebSocket.OPEN && inputValue.trim()) {
//       console.log('실제 메시지 전송:', inputValue)
//       // 실제로 서버에 메시지 전송
//       socket.send(inputValue)
//       // UI에 "보낸 메시지" 추가
//       setMessages((prev) => [
//         ...prev,
//         `${getCurrentTime()} - 📤 보낸 메시지: ${inputValue}`,
//       ])
//       // 입력창 비우기
//       setInputValue('')
//     }
//   }

//   // 연결 해제
//   const disconnect = () => {
//     if (socket) {
//       console.log('🔌 연결 해제 중...')
//       socket.close(1000, 'User disconnected')
//       setSocket(null)
//     }
//   }

//   return (
//     <div style={{ padding: '20px', maxWidth: '600px' }}>
//       <h2>웹소켓 테스트</h2>

//       <div style={{ marginBottom: '10px' }}>
//         <div className="mt-5 mb-5 flex gap-5">
//           <button
//             onClick={connect}
//             disabled={isConnected}
//             className="rounded-md border border-gray-400 p-2"
//           >
//             연결하기
//           </button>
//           <button
//             onClick={disconnect}
//             disabled={!isConnected}
//             className="rounded-md border border-gray-400 p-2"
//           >
//             연결 해제
//           </button>
//         </div>
//         {/* 상세 연결 상태 - 새로 추가 */}
//         <div
//           style={{
//             marginTop: '10px',
//             padding: '10px',
//             backgroundColor: '#f0f0f0',
//             borderRadius: '5px',
//             fontSize: '14px',
//           }}
//         >
//           <div>
//             <strong>🔍 상세 상태:</strong>
//           </div>
//           <div
//             style={{
//               color: getConnectionStateColor(connectionState),
//               fontWeight: 'bold',
//               marginTop: '5px',
//             }}
//           >
//             {getConnectionStateText(connectionState)}
//           </div>

//           {connectionState !== null && (
//             <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
//               실시간 readyState: {connectionState} <br />
//               <br />
//               readyState === 0 : 연결중 <br />
//               readyState === 1 : 연결됨 <br />
//               readyState === 2 : 연결종료 중 <br />
//               readyState === 3 : 연결종료 <br />
//             </div>
//           )}
//         </div>
//       </div>

//       <div
//         style={{
//           border: '1px solid #ccc',
//           height: '300px',
//           overflow: 'auto',
//           padding: '10px',
//           backgroundColor: '#f9f9f9',
//         }}
//       >
//         {messages.map((msg, index) => (
//           <div key={index} style={{ marginBottom: '5px' }}>
//             {msg}
//           </div>
//         ))}
//       </div>
//       <div style={{ marginBottom: '10px' }}>
//         <input
//           type="text"
//           value={inputValue}
//           onChange={(e) => setInputValue(e.target.value)}
//           placeholder="메시지를 입력하세요"
//           disabled={!isConnected}
//           onKeyDown={(e) => {
//             if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
//               sendMessage()
//             }
//           }}
//         />
//         <button
//           onClick={sendMessage}
//           disabled={!isConnected}
//           style={{ marginLeft: '5px' }}
//         >
//           전송
//         </button>
//       </div>
//     </div>
//   )
// }
