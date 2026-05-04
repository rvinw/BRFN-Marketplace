import { createContext, useContext, useState } from 'react';

const PostcodeContext = createContext(null);

export function PostcodeProvider({ children }) {
  const [postcode, setPostcode] = useState(
    () => localStorage.getItem('brfn_postcode') ?? ''
  );

  const savePostcode = (value) => {
    const normalised = value.trim().toUpperCase();
    setPostcode(normalised);
    localStorage.setItem('brfn_postcode', normalised);
  };

  return (
    <PostcodeContext.Provider value={{ postcode, savePostcode }}>
      {children}
    </PostcodeContext.Provider>
  );
}

export const usePostcode = () => useContext(PostcodeContext);
