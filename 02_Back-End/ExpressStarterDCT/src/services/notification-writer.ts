import type { Prisma } from '../generated/client/client.js'
import type { NotificationType } from '../generated/client/enums'

type NotificationInput = {
  appointmentId: number
  eventKey: string
  payload: Prisma.InputJsonValue
  recipientUserId: number | null
  type: NotificationType
}

export const writeNotification = async (
  transaction: Prisma.TransactionClient,
  input: NotificationInput,
) => {
  if (!input.recipientUserId) return
  await transaction.inAppNotification.create({
    data: {
      appointmentId: input.appointmentId,
      eventKey: input.eventKey,
      payload: input.payload,
      recipientUserId: input.recipientUserId,
      type: input.type,
    },
  })
}
