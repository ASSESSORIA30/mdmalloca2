import type { Locale } from "./schema";
import { site } from "@/lib/site";

type Doc = { title: string; sections: { h: string; p: string[] }[] };
const L = site.legal;

/* Templates for Spanish law (LSSI-CE, GDPR + LOPDGDD). They MUST be reviewed by counsel.
   Bracketed values come from src/lib/site.ts. */
export const legal: Record<"privacy" | "legal-notice" | "cookies", Record<Locale, Doc>> = {
  privacy: {
    en: {
      title: "Privacy policy",
      sections: [
        { h: "Controller", p: [`${L.company}, ${L.taxId}, ${L.address}. Contact: ${site.contact.email}.`] },
        { h: "What we collect", p: ["The details you send through the enquiry form: name, email, phone (optional), country of residence (optional), the residence you are interested in and your message."] },
        { h: "Why", p: ["To answer your enquiry and, if you ask for it, arrange a presentation or send the private dossier. Legal basis: your consent and pre-contractual measures at your request (art. 6.1.a and 6.1.b GDPR)."] },
        { h: "How long", p: ["While we handle your enquiry and, afterwards, for the periods required by law. [Define the retention period.]"] },
        { h: "Who receives it", p: ["Our sales team. Service providers acting on our behalf: hosting [Vercel], database [Supabase], transactional email [Resend], CRM [name]. No data is sold or shared for advertising. [List any international transfers and their safeguards.]"] },
        { h: "Your rights", p: [`You can access, rectify, erase, restrict, object and port your data, and withdraw consent at any time, by writing to ${site.contact.email}. You may also complain to the Agencia Española de Protección de Datos (aepd.es).`] },
      ],
    },
    es: {
      title: "Política de privacidad",
      sections: [
        { h: "Responsable", p: [`${L.company}, ${L.taxId}, ${L.address}. Contacto: ${site.contact.email}.`] },
        { h: "Qué datos tratamos", p: ["Los que nos envía mediante el formulario: nombre, correo, teléfono (opcional), país de residencia (opcional), la residencia de interés y su mensaje."] },
        { h: "Finalidad", p: ["Atender su consulta y, si lo solicita, organizar una presentación o enviarle el dossier privado. Base jurídica: su consentimiento y la aplicación de medidas precontractuales a petición suya (art. 6.1.a y 6.1.b RGPD)."] },
        { h: "Conservación", p: ["Mientras se gestiona su consulta y, después, durante los plazos legalmente exigidos. [Defina el plazo de conservación.]"] },
        { h: "Destinatarios", p: ["Nuestro equipo comercial y proveedores que actúan por cuenta nuestra: alojamiento [Vercel], base de datos [Supabase], correo transaccional [Resend], CRM [nombre]. No se ceden datos con fines publicitarios. [Indique transferencias internacionales y garantías.]"] },
        { h: "Derechos", p: [`Puede ejercer sus derechos de acceso, rectificación, supresión, limitación, oposición y portabilidad, y retirar su consentimiento, escribiendo a ${site.contact.email}. También puede reclamar ante la Agencia Española de Protección de Datos (aepd.es).`] },
      ],
    },
    ca: {
      title: "Política de privadesa",
      sections: [
        { h: "Responsable", p: [`${L.company}, ${L.taxId}, ${L.address}. Contacte: ${site.contact.email}.`] },
        { h: "Quines dades tractem", p: ["Les que ens envieu mitjançant el formulari: nom, correu, telèfon (opcional), país de residència (opcional), la residència d'interès i el missatge."] },
        { h: "Finalitat", p: ["Atendre la vostra consulta i, si ho sol·liciteu, organitzar una presentació o enviar-vos el dossier privat. Base jurídica: el vostre consentiment i l'aplicació de mesures precontractuals a petició vostra (art. 6.1.a i 6.1.b RGPD)."] },
        { h: "Conservació", p: ["Mentre es gestiona la consulta i, després, durant els terminis legalment exigits. [Definiu el termini de conservació.]"] },
        { h: "Destinataris", p: ["El nostre equip comercial i proveïdors que actuen per compte nostre: allotjament [Vercel], base de dades [Supabase], correu transaccional [Resend], CRM [nom]. No es cedeixen dades amb finalitats publicitàries."] },
        { h: "Drets", p: [`Podeu exercir els drets d'accés, rectificació, supressió, limitació, oposició i portabilitat, i retirar el consentiment, escrivint a ${site.contact.email}. També podeu reclamar davant l'Agència Espanyola de Protecció de Dades (aepd.es).`] },
      ],
    },
  },
  "legal-notice": {
    en: {
      title: "Legal notice",
      sections: [
        { h: "Owner of this website", p: [`${L.company}. Tax ID: ${L.taxId}. Registered address: ${L.address}. ${L.registry}. Email: ${site.contact.email}.`] },
        { h: "Information on this website", p: ["Images, films, 3D models, panoramas and figures may be indicative or demonstrative and do not form part of any contract. Prices, availability and specifications are confirmed only in writing by ModularDom."] },
        { h: "Intellectual property", p: ["The content, design and code of this website belong to ModularDom or its licensors."] },
      ],
    },
    es: {
      title: "Aviso legal",
      sections: [
        { h: "Titular del sitio web", p: [`${L.company}. NIF: ${L.taxId}. Domicilio social: ${L.address}. ${L.registry}. Correo: ${site.contact.email}.`] },
        { h: "Información del sitio web", p: ["Las imágenes, vídeos, modelos 3D, panorámicas y cifras pueden ser orientativos o de demostración y no forman parte de ningún contrato. Precios, disponibilidad y características solo se confirman por escrito por ModularDom."] },
        { h: "Propiedad intelectual", p: ["Los contenidos, el diseño y el código de este sitio pertenecen a ModularDom o a sus licenciantes."] },
      ],
    },
    ca: {
      title: "Avís legal",
      sections: [
        { h: "Titular del lloc web", p: [`${L.company}. NIF: ${L.taxId}. Domicili social: ${L.address}. ${L.registry}. Correu: ${site.contact.email}.`] },
        { h: "Informació del lloc web", p: ["Les imatges, vídeos, models 3D, panoràmiques i xifres poden ser orientatius o de demostració i no formen part de cap contracte. Preus, disponibilitat i característiques només es confirmen per escrit per ModularDom."] },
        { h: "Propietat intel·lectual", p: ["Els continguts, el disseny i el codi d'aquest lloc pertanyen a ModularDom o als seus llicenciants."] },
      ],
    },
  },
  cookies: {
    en: {
      title: "Cookie policy",
      sections: [
        { h: "What this site stores", p: ["This website uses no advertising or analytics cookies. It stores only a technical preference in your browser session (whether you dismissed the preview notice), which requires no consent."] },
        { h: "Third-party content", p: ["Map tiles are loaded from the map provider when you reach the location section; the provider receives your IP address to deliver them. If analytics are added in future, this policy and a consent banner will be updated before they run."] },
      ],
    },
    es: {
      title: "Política de cookies",
      sections: [
        { h: "Qué guarda este sitio", p: ["Este sitio no utiliza cookies publicitarias ni analíticas. Solo guarda una preferencia técnica en la sesión del navegador (si ha cerrado el aviso de vista previa), que no requiere consentimiento."] },
        { h: "Contenido de terceros", p: ["Los mapas se cargan desde el proveedor cartográfico al llegar a la sección de ubicación; el proveedor recibe su dirección IP para servirlos. Si en el futuro se añade analítica, esta política y un aviso de consentimiento se actualizarán antes de activarla."] },
      ],
    },
    ca: {
      title: "Política de galetes",
      sections: [
        { h: "Què guarda aquest lloc", p: ["Aquest lloc no fa servir galetes publicitàries ni analítiques. Només guarda una preferència tècnica a la sessió del navegador (si heu tancat l'avís de previsualització), que no requereix consentiment."] },
        { h: "Contingut de tercers", p: ["Els mapes es carreguen des del proveïdor cartogràfic en arribar a la secció d'ubicació; el proveïdor rep la vostra adreça IP per servir-los. Si en el futur s'hi afegeix analítica, aquesta política i un avís de consentiment s'actualitzaran abans d'activar-la."] },
      ],
    },
  },
};
