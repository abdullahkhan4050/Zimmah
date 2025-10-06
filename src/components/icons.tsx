import type { SVGProps } from "react";
import Image from "next/image";

export function ZimmahLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <Image
      src="https://i.postimg.cc/NfC213z7/zimmah-logo.png"
      alt="Zimmah Logo"
      width={112}
      height={112}
      className={props.className}
    />
  );
}

export function NaiveForceLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      {...props}
    >
      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" opacity="0.2" />
      <path d="M128,16a112,112,0,1,0,112,112A112.13,112.13,0,0,0,128,16Zm0,208a96,96,0,1,1,96-96A96.11,96.11,0,0,1,128,224Z" />
      <path d="M168,88.29,152,80l-24,32-24-32-16,8.29V104h8v48H80v16h24V152h48v16h24V152h-8V104h8ZM112,136H96V104h8.71L112,113.17ZM160,136h-16V113.17L151.29,104H160Z" />
    </svg>
  );
}
