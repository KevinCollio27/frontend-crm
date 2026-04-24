export interface Mail {
  id: string
  name: string
  email: string
  subject: string
  text: string
  date: string
  read: boolean
  labels: string[]
}

export type Folder =
  | "inbox"
  | "drafts"
  | "sent"
  | "junk"
  | "archive"
  | "trash"

export const mails: Mail[] = [
  {
    id: "1",
    name: "William Smith",
    email: "william.smith@example.com",
    subject: "Reunión mañana",
    text: "Hola, me gustaría tener una reunión mañana para discutir el proyecto. He revisado los detalles y tengo algunas ideas que me gustaría compartir. Es crucial que nos alineemos en los próximos pasos para asegurar el éxito del proyecto. Por favor, ven preparado con cualquier pregunta o comentario que tengas. ¡Espero nuestra reunión! Saludos, William",
    date: "2024-10-22T09:00:00",
    read: false,
    labels: ["reunión", "trabajo", "importante"],
  },
  {
    id: "2",
    name: "Alice Smith",
    email: "alice.smith@example.com",
    subject: "Re: Actualización del proyecto",
    text: "Gracias por la actualización del proyecto. Se ve genial. He revisado el informe y el progreso es impresionante. El equipo ha hecho un trabajo fantástico y estoy segura de que vamos en la dirección correcta.",
    date: "2024-10-22T08:15:00",
    read: true,
    labels: ["trabajo", "importante"],
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    subject: "Planes para el fin de semana",
    text: "¿Tienes planes para el fin de semana? Estaba pensando en ir de senderismo a las montañas cercanas. Hace un tiempo que no hacemos algo al aire libre y sería bueno reconectar.",
    date: "2024-10-21T14:30:00",
    read: true,
    labels: ["personal"],
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.davis@example.com",
    subject: "Re: Pregunta sobre el presupuesto",
    text: "Tengo una pregunta sobre el presupuesto del próximo proyecto. Parece que hay una discrepancia en la asignación de recursos. He revisado el informe presupuestario e identificado algunas áreas donde podríamos optimizar el gasto sin comprometer la calidad del proyecto.",
    date: "2024-10-21T13:00:00",
    read: false,
    labels: ["trabajo", "presupuesto"],
  },
  {
    id: "5",
    name: "Michael Wilson",
    email: "michael.wilson@example.com",
    subject: "Anuncio importante",
    text: "Tengo un anuncio importante que hacer en la reunión de equipo de mañana. Se trata de un cambio estratégico en nuestro enfoque para el lanzamiento del nuevo producto. Los detalles se compartirán en la reunión, pero quería alertarlos con anticipación.",
    date: "2024-10-20T17:45:00",
    read: false,
    labels: ["trabajo", "urgente"],
  },
  {
    id: "6",
    name: "Sarah Brown",
    email: "sarah.brown@example.com",
    subject: "Invitación a evento de networking",
    text: "Me complace invitarte a nuestro próximo evento de networking el próximo jueves por la noche. Será una gran oportunidad para conectar con profesionales del sector y conocer las últimas tendencias.",
    date: "2024-10-20T11:00:00",
    read: true,
    labels: ["networking", "evento"],
  },
  {
    id: "7",
    name: "David Lee",
    email: "david.lee@example.com",
    subject: "Propuesta de colaboración",
    text: "He estado pensando en una posible colaboración entre nuestros equipos. Creo que hay una gran sinergia potencial y me gustaría explorar cómo podríamos trabajar juntos en algunos proyectos.",
    date: "2024-10-19T16:20:00",
    read: true,
    labels: ["trabajo"],
  },
  {
    id: "8",
    name: "Jennifer Martinez",
    email: "jennifer.martinez@example.com",
    subject: "Actualización del estado del proyecto",
    text: "Quería actualizarte sobre el estado actual del proyecto. Hemos logrado hitos importantes esta semana y el equipo está en camino para cumplir el plazo del próximo mes. Aquí hay un resumen de los logros y los próximos pasos.",
    date: "2024-10-19T10:00:00",
    read: false,
    labels: ["trabajo", "actualización"],
  },
  {
    id: "9",
    name: "Chris Anderson",
    email: "chris.anderson@example.com",
    subject: "Oportunidad de negocio",
    text: "Me estoy comunicando para discutir una posible oportunidad de negocio que creo podría ser mutuamente beneficiosa. Después de investigar tu empresa, creo que hay un mercado potencial que podríamos explorar juntos.",
    date: "2024-10-18T15:30:00",
    read: true,
    labels: ["negocio"],
  },
  {
    id: "10",
    name: "Lisa Thompson",
    email: "lisa.thompson@example.com",
    subject: "Re: Solicitud de feedback",
    text: "Gracias por compartir tu trabajo. He revisado todo minuciosamente y tengo algunos comentarios constructivos que creo que te ayudarán a mejorarlo. En general, el trabajo es de alta calidad y la atención al detalle es notable.",
    date: "2024-10-18T09:45:00",
    read: true,
    labels: ["feedback"],
  },
]
