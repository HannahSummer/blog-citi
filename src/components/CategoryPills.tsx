import { Link } from 'react-router-dom'
import { categories } from '../data/categorias'

export function CategoryPills({ active }: { active?: string }) {
  return <div className="category-pills" aria-label="Categorias">
    <Link className={!active ? 'pill active' : 'pill'} to="/blog/artigos">Todos</Link>
    {categories.map((category) => <Link className={active === category.slug ? 'pill active' : 'pill'} to={`/blog/artigos?categoria=${category.slug}`} key={category.slug}>{category.label}</Link>)}
  </div>
}
