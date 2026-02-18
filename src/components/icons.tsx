import type { JSX } from 'solid-js'

type IconProps = {
  class?: string
}

const base = 'h-4 w-4 shrink-0'

const wrap = (path: JSX.Element) => (props: IconProps) => (
  <svg
    class={`${base}${props.class ? ` ${props.class}` : ''}`}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    {path}
  </svg>
)

export const IconBell = wrap(
  <>
    <path d="M6 8a6 6 0 1 1 12 0v5l2 3H4l2-3Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </>,
)

export const IconChevronUp = wrap(<path d="m6 15 6-6 6 6" />)
export const IconChevronDown = wrap(<path d="m6 9 6 6 6-6" />)
export const IconCheckSquare = wrap(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="m9 12 2 2 4-4" />
  </>,
)
export const IconClock = wrap(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>,
)
export const IconDownload = wrap(
  <>
    <path d="M12 3v11" />
    <path d="m8 10 4 4 4-4" />
    <path d="M4 20h16" />
  </>,
)
export const IconEdit = wrap(
  <>
    <path d="M12 20h9" />
    <path d="m16.5 3.5 4 4L8 20l-4 1 1-4Z" />
  </>,
)
export const IconMove = wrap(
  <>
    <path d="M12 2v20" />
    <path d="m7 7 5-5 5 5" />
    <path d="m7 17 5 5 5-5" />
  </>,
)
export const IconPlus = wrap(
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>,
)
export const IconSearch = wrap(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </>,
)
export const IconSmartphone = wrap(
  <>
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <path d="M11 18h2" />
  </>,
)
export const IconStar = (props: IconProps) => (
  <svg
    class={`${base}${props.class ? ` ${props.class}` : ''}`}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    stroke-width="1.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2 7.5 14 3 9.6l6.2-.9Z" />
  </svg>
)
export const IconTag = wrap(
  <>
    <path d="M20 10 12 2H4v8l8 8z" />
    <circle cx="7.5" cy="7.5" r="1" />
  </>,
)
export const IconTrash = wrap(
  <>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="m6 6 1 14h10l1-14" />
  </>,
)
export const IconUpload = wrap(
  <>
    <path d="M12 21V10" />
    <path d="m8 14 4-4 4 4" />
    <path d="M4 4h16" />
  </>,
)
export const IconX = wrap(
  <>
    <path d="m18 6-12 12" />
    <path d="m6 6 12 12" />
  </>,
)
