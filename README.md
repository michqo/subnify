# Subnify

Subnify is a VLSM-focused subnet planning tool with a calculator and interactive visualizer.

## Calculator App Subnify (`/app`)

Full-featured VLSM calculator with:

- Collapsible sidebar navigation
- Network configuration inputs for base network and CIDR
- Dynamic subnet requirement management (add/remove subnets)
- Two result modes: table view and card view
- Copy and export functionality
- Efficiency statistics for allocation vs requirements

## Network Visualizer (`/app/visualizer`)

Interactive subnet visualization with:

- Linear address-space bar showing subnet allocations
- Hierarchical tree view of subnet relationships
- Interactive subnet selection (click to highlight)
- Zoom controls for detailed inspection
- Real-time utilization statistics

## Run locally

```bash
pnpm install
pnpm dev
```
