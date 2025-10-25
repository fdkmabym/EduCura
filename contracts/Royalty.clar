 
(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-TOKEN-ID u101)
(define-constant ERR-INVALID-ROYALTY-RATE u102)
(define-constant ERR-INVALID-SALE-AMOUNT u103)
(define-constant ERR-ROYALTY-ALREADY-SET u104)
(define-constant ERR-TOKEN-NOT-FOUND u105)
(define-constant ERR-INVALID-RECIPIENT u106)
(define-constant ERR-INVALID-PERCENTAGE u107)
(define-constant ERR-MAX-RECIPIENTS-EXCEEDED u108)
(define-constant ERR-INVALID-EXPIRATION u109)
(define-constant ERR-ROYALTY-EXPIRED u110)
(define-constant ERR-INVALID-UPDATE u111)
(define-constant ERR-AUTHORITY-NOT-VERIFIED u112)
(define-constant ERR-INVALID-MIN-RATE u113)
(define-constant ERR-INVALID-MAX-RATE u114)
(define-constant ERR-TRANSFER-FAILED u115)
(define-constant ERR-INVALID-CURRENCY u116)
(define-constant ERR-INVALID-STATUS u117)
(define-constant ERR-MAX-ROYALTIES-EXCEEDED u118)
(define-constant ERR-INVALID-TIER u119)
(define-constant ERR-INVALID-THRESHOLD u120)

(define-data-var next-royalty-id uint u0)
(define-data-var max-royalties uint u1000)
(define-data-var min-royalty-rate uint u100)
(define-data-var max-royalty-rate uint u2000)
(define-data-var authority-contract (optional principal) none)
(define-data-var payment-token-contract principal 'SP000000000000000000002Q6VF78.payments)

(define-map royalties
  uint
  {
    token-id: uint,
    creator: principal,
    rate: uint,
    expiration: uint,
    status: bool,
    currency: (string-utf8 20),
    min-rate: uint,
    max-rate: uint
  }
)

(define-map royalty-recipients
  { royalty-id: uint, index: uint }
  { recipient: principal, percentage: uint }
)

(define-map royalty-tiers
  { royalty-id: uint, tier: uint }
  { threshold: uint, rate: uint }
)

(define-map royalty-updates
  uint
  {
    update-rate: uint,
    update-expiration: uint,
    update-timestamp: uint,
    updater: principal
  }
)

(define-read-only (get-royalty (id uint))
  (map-get? royalties id)
)

(define-read-only (get-royalty-recipient (royalty-id uint) (index uint))
  (map-get? royalty-recipients { royalty-id: royalty-id, index: index })
)

(define-read-only (get-royalty-tier (royalty-id uint) (tier uint))
  (map-get? royalty-tiers { royalty-id: royalty-id, tier: tier })
)

(define-read-only (get-royalty-updates (id uint))
  (map-get? royalty-updates id)
)

(define-private (validate-token-id (token uint))
  (if (> token u0)
      (ok true)
      (err ERR-INVALID-TOKEN-ID))
)

(define-private (validate-royalty-rate (rate uint))
  (let ((min-rate (var-get min-royalty-rate)) (max-rate (var-get max-royalty-rate)))
    (if (and (>= rate min-rate) (<= rate max-rate))
        (ok true)
        (err ERR-INVALID-ROYALTY-RATE)))
)

(define-private (validate-sale-amount (amount uint))
  (if (> amount u0)
      (ok true)
      (err ERR-INVALID-SALE-AMOUNT))
)

(define-private (validate-recipient (recipient principal))
  (if (not (is-eq recipient tx-sender))
      (ok true)
      (err ERR-INVALID-RECIPIENT))
)

(define-private (validate-percentage (perc uint))
  (if (and (> perc u0) (<= perc u10000))
      (ok true)
      (err ERR-INVALID-PERCENTAGE))
)

(define-private (validate-expiration (exp uint))
  (if (>= exp block-height)
      (ok true)
      (err ERR-INVALID-EXPIRATION))
)

(define-private (validate-currency (cur (string-utf8 20)))
  (if (or (is-eq cur "STX") (is-eq cur "CURA"))
      (ok true)
      (err ERR-INVALID-CURRENCY))
)

(define-private (validate-tier (tier uint))
  (if (> tier u0)
      (ok true)
      (err ERR-INVALID-TIER))
)

(define-private (validate-threshold (thresh uint))
  (if (> thresh u0)
      (ok true)
      (err ERR-INVALID-THRESHOLD))
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (asserts! (is-none (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-min-royalty-rate (new-min uint))
  (begin
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (asserts! (< new-min (var-get max-royalty-rate)) (err ERR-INVALID-MIN-RATE))
    (var-set min-royalty-rate new-min)
    (ok true)
  )
)

(define-public (set-max-royalty-rate (new-max uint))
  (begin
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (asserts! (> new-max (var-get min-royalty-rate)) (err ERR-INVALID-MAX-RATE))
    (var-set max-royalty-rate new-max)
    (ok true)
  )
)

(define-public (set-payment-token-contract (new-contract principal))
  (begin
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set payment-token-contract new-contract)
    (ok true)
  )
)

(define-public (create-royalty
  (token-id uint)
  (rate uint)
  (expiration uint)
  (currency (string-utf8 20))
  (min-rate uint)
  (max-rate uint)
)
  (let ((next-id (var-get next-royalty-id)) (auth (var-get authority-contract)))
    (asserts! (< next-id (var-get max-royalties)) (err ERR-MAX-ROYALTIES-EXCEEDED))
    (try! (validate-token-id token-id))
    (try! (validate-royalty-rate rate))
    (try! (validate-expiration expiration))
    (try! (validate-currency currency))
    (asserts! (is-some auth) (err ERR-AUTHORITY-NOT-VERIFIED))
    (map-set royalties next-id
      {
        token-id: token-id,
        creator: tx-sender,
        rate: rate,
        expiration: expiration,
        status: true,
        currency: currency,
        min-rate: min-rate,
        max-rate: max-rate
      }
    )
    (var-set next-royalty-id (+ next-id u1))
    (print { event: "royalty-created", id: next-id })
    (ok next-id)
  )
)

(define-public (add-royalty-recipient (royalty-id uint) (recipient principal) (percentage uint) (index uint))
  (let ((royalty (map-get? royalties royalty-id)))
    (match royalty r
      (begin
        (asserts! (is-eq (get creator r) tx-sender) (err ERR-NOT-AUTHORIZED))
        (try! (validate-recipient recipient))
        (try! (validate-percentage percentage))
        (map-set royalty-recipients { royalty-id: royalty-id, index: index }
          { recipient: recipient, percentage: percentage })
        (ok true)
      )
      (err ERR-TOKEN-NOT-FOUND)
    )
  )
)

(define-public (add-royalty-tier (royalty-id uint) (tier uint) (threshold uint) (rate uint))
  (let ((royalty (map-get? royalties royalty-id)))
    (match royalty r
      (begin
        (asserts! (is-eq (get creator r) tx-sender) (err ERR-NOT-AUTHORIZED))
        (try! (validate-tier tier))
        (try! (validate-threshold threshold))
        (try! (validate-royalty-rate rate))
        (map-set royalty-tiers { royalty-id: royalty-id, tier: tier }
          { threshold: threshold, rate: rate })
        (ok true)
      )
      (err ERR-TOKEN-NOT-FOUND)
    )
  )
)

(define-public (distribute-royalty (royalty-id uint) (sale-amount uint))
  (let ((royalty (map-get? royalties royalty-id)))
    (match royalty r
      (begin
        (asserts! (>= block-height (get expiration r)) (err ERR-ROYALTY-EXPIRED))
        (try! (validate-sale-amount sale-amount))
        (let ((royalty-amount (/ (* sale-amount (get rate r)) u10000)))
          (try! (as-contract (contract-call? .payment-token-contract transfer royalty-amount tx-sender (get creator r) none)))
          (ok royalty-amount)
        )
      )
      (err ERR-TOKEN-NOT-FOUND)
    )
  )
)

(define-public (update-royalty (royalty-id uint) (new-rate uint) (new-expiration uint))
  (let ((royalty (map-get? royalties royalty-id)))
    (match royalty r
      (begin
        (asserts! (is-eq (get creator r) tx-sender) (err ERR-NOT-AUTHORIZED))
        (try! (validate-royalty-rate new-rate))
        (try! (validate-expiration new-expiration))
        (map-set royalties royalty-id
          (merge r { rate: new-rate, expiration: new-expiration }))
        (map-set royalty-updates royalty-id
          { update-rate: new-rate, update-expiration: new-expiration, update-timestamp: block-height, updater: tx-sender })
        (print { event: "royalty-updated", id: royalty-id })
        (ok true)
      )
      (err ERR-TOKEN-NOT-FOUND)
    )
  )
)

(define-public (get-royalty-count)
  (ok (var-get next-royalty-id))
)