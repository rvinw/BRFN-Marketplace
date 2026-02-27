export default function SearchBar() {
  return (
    <div className="search">
      <input className="search__input" placeholder="Search local products…" />
      <button className="search__btn" type="button">
        Search
      </button>
    </div>
  );
}