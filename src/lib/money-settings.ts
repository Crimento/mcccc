export type MoneyBlock = {
  id: 'bills' | 'child-support' | 'inheritance'
  label: string
  description: string
  keys: string[]
}

// Presentation only: these eight settings keep their own saved values and do
// not enable, disable, reset, or create any other setting in the group.
export const moneyBlocks: MoneyBlock[] = [
  {
    id: 'bills',
    label: 'Bills',
    description: 'Adjust apartment and house bills independently. 0% leaves bills unchanged, −100% removes base bills except child support, and 100% doubles them.',
    keys: ['Bill_AmountPercentApartment', 'Bill_Amount_Percent', 'Bill_AutoPay', 'Tuner_Child_Pay_Bills'],
  },
  {
    id: 'child-support',
    label: 'Child support',
    description: 'Choose which parents pay child support and the percentage of their total worth billed per child.',
    keys: ['Pay_Child_Support_Type', 'Pay_Child_Support_Percent'],
  },
  {
    id: 'inheritance',
    label: 'Inheritance',
    description: 'Choose which Sims leave an inheritance and whether an eligible spouse receives it first.',
    keys: ['Inherit_Sim_Type', 'Inherit_Spouse_First'],
  },
]

export const moneySettingKeys = new Set(moneyBlocks.flatMap(block => block.keys))
