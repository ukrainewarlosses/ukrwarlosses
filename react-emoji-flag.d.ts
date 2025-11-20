declare module 'react-emoji-flag' {
  import { Component } from 'react';
  
  interface CountryFlagProps {
    countryCode: string;
    title?: string;
    style?: React.CSSProperties;
    className?: string;
  }
  
  export default class CountryFlag extends Component<CountryFlagProps> {}
}

