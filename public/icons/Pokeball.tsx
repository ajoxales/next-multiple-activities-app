const Pokeball = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 8 8"
    {...props}
  >
    <path
      fill="#000000"
      d="M0 4c0-5.25 8-5.25 8 0S0 9.25 0 4m1 0c0 4 6 4 6 0H6Q4 1 2 4m1 0l1-1l1 1l-1 1"
    ></path>
  </svg>
);

export default Pokeball;
