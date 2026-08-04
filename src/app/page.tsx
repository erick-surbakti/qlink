import Link from "next/link";
import { ArrowRight, ClipboardCheck, Factory, LayoutDashboard, UserRoundCog } from "lucide-react";

const roles = [
  {
    key: "leading",
    title: "Leading",
    description: "Open the checklist flow for production leading personnel.",
    icon: UserRoundCog,
    href: "/verify?role=leading",
  },
  {
    key: "dashboard",
    title: "Dashboard",
    description: "Review Operator checklist activity, approvals, and analysis.",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    key: "operator",
    title: "Operator",
    description: "Open the checklist flow for production operators.",
    icon: Factory,
    href: "/verify?role=operator",
  },
] as const;

export default function ChecklistRolePage() {
  return (
    <main className="shell">
      <section className="role-panel">
        <div className="brand-mark" aria-hidden="true">
          <ClipboardCheck size={34} strokeWidth={2.2} />
        </div>
        <p className="eyebrow">Q-LINK PRODUCTION</p>
        <h1>Production Checklist</h1>
        <p className="lead">Select your checklist role before verifying your employee card.</p>

        <div className="role-grid">
          {roles.map(({ title, description, icon: Icon, href }) => (
            <Link className="role-card" href={href} key={href}>
              <span className="role-icon"><Icon size={30} /></span>
              <span className="role-copy">
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              <ArrowRight className="role-arrow" size={23} />
            </Link>
          ))}
        </div>

        <p className="mock-note">Prototype mode · all information shown in this application is mock data.</p>
      </section>
    </main>
  );
}
