import { createTRPCRouter } from './trpc'
import { authRouter } from './routers/auth.router'
import { consultationRouter } from './routers/consultation.router'
import { emrRouter } from './routers/emr.router'
import { treatmentRouter } from './routers/treatment.router'
import { productRouter } from './routers/product.router'
import { paymentRouter } from './routers/payment.router'
import { notificationRouter } from './routers/notification.router'
import { orderRouter } from './routers/order.router'
import { doctorRouter } from './routers/doctor.router'
import { adminRouter } from './routers/admin.router'
import { quizRouter } from './routers/quiz.router'
import { prescriptionRouter } from './routers/prescription.router'
import { documentRouter } from './routers/document.router'
import { marketplaceRouter } from './routers/marketplace.router'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  consultation: consultationRouter,
  emr: emrRouter,
  treatment: treatmentRouter,
  product: productRouter,
  payment: paymentRouter,
  notification: notificationRouter,
  order: orderRouter,
  doctor: doctorRouter,
  admin: adminRouter,
  quiz: quizRouter,
  prescription: prescriptionRouter,
  document: documentRouter,
  marketplace: marketplaceRouter,
})

export type AppRouter = typeof appRouter
