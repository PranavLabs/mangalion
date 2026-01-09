// Inside the {mangaList.map...} loop:

<div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-neutral-800 mb-3 shadow-lg group-hover:shadow-blue-900/20">
  <img 
    // WE REMOVED THE REFERER PARAM. The Proxy calculates it now.
    src={`/api/proxy?url=${encodeURIComponent(m.image)}`} 
    className="object-cover w-full h-full group-hover:scale-110 transition duration-500 ease-out"
    alt={m.title}
    loading="lazy"
  />
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
</div>
