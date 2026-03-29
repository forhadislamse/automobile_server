export const getTransactionId = () => {
    return `${Date.now()}${Math.floor(Math.random() * 1000)}`
}