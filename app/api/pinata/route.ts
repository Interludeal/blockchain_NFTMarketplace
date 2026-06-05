import { NextRequest, NextResponse } from 'next/server'

function getPinataJwt() {
  return process.env.PINATA_JWT ?? process.env.pinata_jwt
}

export async function POST(request: NextRequest) {
  const jwt = getPinataJwt()
  if (!jwt) {
    return NextResponse.json(
      { error: 'Pinata JWT가 설정되지 않았습니다. .env에 PINATA_JWT를 추가하세요.' },
      { status: 500 },
    )
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const name = formData.get('name')
  const description = formData.get('description')

  if (!(file instanceof File) || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json(
      { error: '이미지 파일과 NFT 이름이 필요합니다.' },
      { status: 400 },
    )
  }

  const imageForm = new FormData()
  imageForm.append('file', file)

  const imageRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: imageForm,
  })

  if (!imageRes.ok) {
    const err = await imageRes.text()
    return NextResponse.json(
      { error: '이미지 업로드에 실패했습니다.', detail: err },
      { status: 502 },
    )
  }

  const imageData = (await imageRes.json()) as { IpfsHash: string }
  const imageUri = `ipfs://${imageData.IpfsHash}`

  const metadata = {
    name: name.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    image: imageUri,
  }

  const jsonRes = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: `${metadata.name}-metadata` },
    }),
  })

  if (!jsonRes.ok) {
    const err = await jsonRes.text()
    return NextResponse.json(
      { error: '메타데이터 업로드에 실패했습니다.', detail: err },
      { status: 502 },
    )
  }

  const jsonData = (await jsonRes.json()) as { IpfsHash: string }

  return NextResponse.json({
    uri: `ipfs://${jsonData.IpfsHash}`,
    imageUri,
  })
}
